import { ENDPOINTS, ONECLICK_PROBE_ROUTES, type QuoteRouteTemplate } from './config.js';
import type { QuoteProbeResult } from '../ui/types.js';

export interface NearBlocksChartRow {
  date: string;
  near_price: number | string;
  market_cap: number | string;
  total_supply: number | string;
  circulating_supply: number | string;
  blocks: number | string;
  gas_fee: number | string;
  gas_used: number | string;
  txns: number | string;
  txn_volume_usd: number | string;
  txn_fee: number | string;
  txn_fee_usd: number | string;
  new_accounts: number | string;
  active_accounts: number | string;
  multichain_txns?: number | string;
}

export interface OneClickToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price?: number;
  contractAddress?: string;
}

const DEFAULT_TIMEOUT_MS = 20_000;

export async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit = {},
  retries = 3,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'User-Agent': 'near-protocol-pnl-research/1.0',
          Accept: 'application/json',
          ...(init.headers || {}),
        },
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} from ${url}: ${body.slice(0, 200)}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function nearRpcCall<T>(method: string, params: unknown): Promise<T> {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 'near-pnl',
    method,
    params,
  });
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  };

  const endpoints = [ENDPOINTS.nearRpcPrimary, ENDPOINTS.nearRpcFallback];
  let lastErr: unknown;
  for (const url of endpoints) {
    try {
      const resp = await fetchJsonWithRetry<{ result?: T; error?: { message?: string } }>(
        url,
        opts,
        2,
        15_000
      );
      if (resp.error) {
        throw new Error(`RPC error on ${url} (${method}): ${JSON.stringify(resp.error)}`);
      }
      if (resp.result === undefined) {
        throw new Error(`Missing RPC result on ${url} (${method})`);
      }
      return resp.result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function pickOneClickToken(
  tokens: readonly OneClickToken[],
  blockchain: string,
  symbol: string
): OneClickToken | undefined {
  const bc = blockchain.toLowerCase();
  const sym = symbol.toLowerCase();
  const matches = tokens.filter(
    (t) => t.blockchain?.toLowerCase() === bc && t.symbol?.toLowerCase() === sym
  );
  if (matches.length === 0) return undefined;
  // Prefer entries with finite positive price
  return matches.find((m) => Number(m.price) > 0) ?? matches[0];
}

function toBaseUnitsString(amountUsd: number, priceUsd: number, decimals: number): string {
  const safePrice = priceUsd > 0 ? priceUsd : 1;
  const tokensFloat = amountUsd / safePrice;
  // Build integer amount at capped precision to avoid floating exponent notation
  const scaleDecimals = Math.min(decimals, 6);
  const scaledInt = Math.max(1, Math.round(tokensFloat * 10 ** scaleDecimals));
  const extraZeros = Math.max(0, decimals - scaleDecimals);
  return `${scaledInt}${'0'.repeat(extraZeros)}`;
}

export async function probeOneClickRoute(
  tokens: readonly OneClickToken[],
  route: QuoteRouteTemplate
): Promise<QuoteProbeResult> {
  const origin = pickOneClickToken(tokens, route.originBlockchain, route.originSymbol);
  const dest = pickOneClickToken(tokens, route.destBlockchain, route.destSymbol);

  if (!origin || !dest) {
    return {
      routeId: route.routeId,
      label: route.label,
      originAsset: origin?.assetId ?? `${route.originBlockchain}:${route.originSymbol}`,
      destinationAsset: dest?.assetId ?? `${route.destBlockchain}:${route.destSymbol}`,
      amountInHuman: 'N/A',
      amountInUsd: null,
      amountOutUsd: null,
      impliedSpreadBps: null,
      estimatedTimeSec: null,
      status: 'unavailable',
      httpStatus: 0,
      note: 'Asset not present in /v0/tokens catalog',
    };
  }

  const originPrice = Number(origin.price) > 0 ? Number(origin.price) : 1;
  const amountBase = toBaseUnitsString(route.targetNotionalUsd, originPrice, origin.decimals);
  const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const body = {
    dry: true,
    swapType: 'EXACT_INPUT',
    slippageTolerance: 100,
    originAsset: origin.assetId,
    depositType: 'ORIGIN_CHAIN',
    destinationAsset: dest.assetId,
    amount: amountBase,
    refundTo: route.refundTo,
    refundType: 'ORIGIN_CHAIN',
    recipient: route.recipient,
    recipientType: 'DESTINATION_CHAIN',
    deadline,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const resp = await fetch(ENDPOINTS.oneClickQuote, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 200) };
    }

    if (!resp.ok) {
      return {
        routeId: route.routeId,
        label: route.label,
        originAsset: origin.assetId,
        destinationAsset: dest.assetId,
        amountInHuman: `${(route.targetNotionalUsd / originPrice).toFixed(4)} ${origin.symbol}`,
        amountInUsd: null,
        amountOutUsd: null,
        impliedSpreadBps: null,
        estimatedTimeSec: null,
        status: 'unavailable',
        httpStatus: resp.status,
        note: String(parsed?.message || parsed?.error || `HTTP ${resp.status}`).slice(0, 120),
      };
    }

    const q = parsed.quote ?? parsed;
    const firstAppFee = Array.isArray(parsed.quoteRequest?.appFees)
      ? parsed.quoteRequest.appFees[0]
      : undefined;
    const inUsd = Number(q.amountInUsd ?? route.targetNotionalUsd);
    const outUsd = Number(q.amountOutUsd ?? 0);
    const spreadBps =
      inUsd > 0 && outUsd > 0 ? ((inUsd - outUsd) / inUsd) * 10_000 : null;
    const formattedIn = q.amountInFormatted
      ? `${Number(q.amountInFormatted).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${origin.symbol}`
      : `${(route.targetNotionalUsd / originPrice).toFixed(4)} ${origin.symbol}`;

    return {
      routeId: route.routeId,
      label: route.label,
      originAsset: origin.assetId,
      destinationAsset: dest.assetId,
      amountInHuman: formattedIn,
      amountInUsd: Number.isFinite(inUsd) ? inUsd : null,
      amountOutUsd: Number.isFinite(outUsd) ? outUsd : null,
      impliedSpreadBps: spreadBps !== null && Number.isFinite(spreadBps) ? spreadBps : null,
      estimatedTimeSec: Number.isFinite(Number(q.timeEstimate)) ? Number(q.timeEstimate) : null,
      appFeeBps: firstAppFee && Number.isFinite(Number(firstAppFee.fee)) ? Number(firstAppFee.fee) : null,
      appFeeRecipient: firstAppFee?.recipient ? String(firstAppFee.recipient) : null,
      status: 'ok',
      httpStatus: resp.status,
      note: 'Dry quote live',
    };
  } catch (err) {
    return {
      routeId: route.routeId,
      label: route.label,
      originAsset: origin.assetId,
      destinationAsset: dest.assetId,
      amountInHuman: 'N/A',
      amountInUsd: null,
      amountOutUsd: null,
      impliedSpreadBps: null,
      estimatedTimeSec: null,
      status: 'unavailable',
      httpStatus: 0,
      note: err instanceof Error ? err.message.slice(0, 120) : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeAllOneClickRoutes(
  tokens: readonly OneClickToken[]
): Promise<QuoteProbeResult[]> {
  return Promise.all(ONECLICK_PROBE_ROUTES.map((route) => probeOneClickRoute(tokens, route)));
}
