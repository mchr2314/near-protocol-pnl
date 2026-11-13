import type { PnlSimulationInput, PnlSimulationResult } from '../ui/types.js';

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
  }
  return sum / values.length;
}

/**
 * Sample Pearson correlation coefficient across paired finite arrays.
 * Returns 0 when length < 2 or variance of either series is zero.
 */
export function pearsonCorrelation(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let valid = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    if (Number.isFinite(x) && Number.isFinite(y)) {
      sumX += x;
      sumY += y;
      valid++;
    }
  }
  if (valid < 2) return 0;

  const mx = sumX / valid;
  const my = sumY / valid;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const dx = x - mx;
    const dy = y - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return 0;
  const r = num / denom;
  return Math.max(-1, Math.min(1, r));
}

function assignAverageRanks(values: readonly number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) {
      j++;
    }
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Spearman rank correlation using tied average ranks.
 */
export function spearmanCorrelation(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const cleanX: number[] = [];
  const cleanY: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) {
      cleanX.push(xs[i]);
      cleanY.push(ys[i]);
    }
  }
  if (cleanX.length < 2) return 0;
  return pearsonCorrelation(assignAverageRanks(cleanX), assignAverageRanks(cleanY));
}

/**
 * Rolling Pearson correlation with fixed window size; entries before windowSize - 1 are null.
 */
export function rollingCorrelation(
  xs: readonly number[],
  ys: readonly number[],
  windowSize: number
): Array<number | null> {
  const n = Math.min(xs.length, ys.length);
  const result: Array<number | null> = new Array(n).fill(null);
  if (windowSize < 2 || n < windowSize) return result;

  for (let i = windowSize - 1; i < n; i++) {
    const sliceX = xs.slice(i - windowSize + 1, i + 1);
    const sliceY = ys.slice(i - windowSize + 1, i + 1);
    result[i] = pearsonCorrelation(sliceX, sliceY);
  }
  return result;
}

/**
 * Discrete daily-compounded / period-scaled annualized supply growth rate (%).
 */
export function annualizedInflationPct(
  startSupply: number,
  endSupply: number,
  daysElapsed: number
): number {
  if (startSupply <= 0 || endSupply <= 0 || daysElapsed <= 0) return 0;
  const periodChange = (endSupply - startSupply) / startSupply;
  return periodChange * (365 / daysElapsed) * 100;
}

/**
 * Computes Nakamoto coefficients (minimum validators needed to reach 33.33% and 50.00% of stake)
 * and top-5 validator stake concentration percentage.
 */
export function computeNakamoto(stakesNear: readonly number[]): {
  totalStakeNear: number;
  top5StakeSharePct: number;
  nakamoto33: number;
  nakamoto50: number;
} {
  const sorted = stakesNear
    .filter((s) => Number.isFinite(s) && s > 0)
    .slice()
    .sort((a, b) => b - a);

  const totalStakeNear = sorted.reduce((acc, s) => acc + s, 0);
  if (totalStakeNear === 0 || sorted.length === 0) {
    return { totalStakeNear: 0, top5StakeSharePct: 0, nakamoto33: 0, nakamoto50: 0 };
  }

  let top5Sum = 0;
  for (let i = 0; i < Math.min(5, sorted.length); i++) {
    top5Sum += sorted[i];
  }

  let cumulative = 0;
  let nakamoto33 = 0;
  let nakamoto50 = 0;

  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i];
    const ratio = cumulative / totalStakeNear;
    if (nakamoto33 === 0 && ratio > 1 / 3) {
      nakamoto33 = i + 1;
    }
    if (nakamoto50 === 0 && ratio > 0.5) {
      nakamoto50 = i + 1;
    }
  }

  return {
    totalStakeNear,
    top5StakeSharePct: (top5Sum / totalStakeNear) * 100,
    nakamoto33: nakamoto33 || sorted.length,
    nakamoto50: nakamoto50 || sorted.length,
  };
}

/**
 * Converts yoctoNEAR string (10^24 yocto = 1 NEAR) to floating NEAR without BigInt precision overflow.
 */
export function yoctoToNear(yoctoStr: string): number {
  const trimmed = (yoctoStr || '0').trim();
  if (!/^\d+$/.test(trimmed)) return 0;
  if (trimmed.length <= 18) {
    return Number(trimmed) / 1e24;
  }
  const integerPartStr = trimmed.length > 24 ? trimmed.slice(0, trimmed.length - 24) : '0';
  const fracStr = trimmed
    .slice(Math.max(0, trimmed.length - 24))
    .padStart(24, '0')
    .slice(0, 6);
  return Number(integerPartStr) + Number(fracStr) / 1e6;
}

/**
 * Pure P&L & Monetary Accrual Simulator for NEAR Protocol.
 * Computes gross L1 issuance, L1 gas burn, incremental Intents settlement gas,
 * hypothetical protocol buyback/burn share, and net inflation / break-even thresholds.
 */
export function simulateProtocolPnl(input: PnlSimulationInput): PnlSimulationResult {
  const safePrice = Math.max(0.01, input.nearPriceUsd);
  const safeSupply = Math.max(1, input.totalSupplyNear);
  const annualGrossIssuanceNear = safeSupply * (Math.max(0, input.maxInflationPct) / 100);
  const dailyGrossIssuanceNear = annualGrossIssuanceNear / 365;
  const dailyGrossIssuanceUsd = dailyGrossIssuanceNear * safePrice;

  const dailyBaselineL1BurnNear = Math.max(0, input.dailyL1GasBurnNear);

  // Average Intents swap ticket ~ $2,500 if deriving incremental L1 settlement txs.
  const estDailySwaps = Math.max(0, input.intentsDailyVolumeUsd) / 2500;
  const dailyIntentsIncrementalBurnNear =
    estDailySwaps * Math.max(0, input.l1SettleTxnsPerSwap) * Math.max(0, input.l1GasPerSettleNear);

  const dailyIntentsFeePoolUsd =
    Math.max(0, input.intentsDailyVolumeUsd) * (Math.max(0, input.intentsProtocolFeeBps) / 10_000);
  const captureShareRatio = Math.max(0, Math.min(100, input.nearAccrualSharePct)) / 100;
  const dailyRoutedToNearUsd = dailyIntentsFeePoolUsd * captureShareRatio;
  const dailyRoutedNearEquivalent = dailyRoutedToNearUsd / safePrice;

  const dailyTotalNearOffset =
    dailyBaselineL1BurnNear + dailyIntentsIncrementalBurnNear + dailyRoutedNearEquivalent;
  const dailyNetIssuanceNear = dailyGrossIssuanceNear - dailyTotalNearOffset;
  const netInflationPct = ((dailyNetIssuanceNear * 365) / safeSupply) * 100;
  const issuanceOffsetPct =
    dailyGrossIssuanceNear > 0 ? (dailyTotalNearOffset / dailyGrossIssuanceNear) * 100 : 0;

  const marketCapUsd = safeSupply * safePrice;
  const annualizedAccrualYieldOnMcapPct =
    marketCapUsd > 0 ? ((dailyTotalNearOffset * safePrice * 365) / marketCapUsd) * 100 : 0;

  const neededAfterBaselineUsd = Math.max(
    0,
    (dailyGrossIssuanceNear - dailyBaselineL1BurnNear) * safePrice
  );
  const unitRevenuePerUsdVol =
    (Math.max(0, input.intentsProtocolFeeBps) / 10_000) * captureShareRatio +
    (Math.max(0, input.l1SettleTxnsPerSwap) * Math.max(0, input.l1GasPerSettleNear) * safePrice) /
      2500;

  const breakEvenDailyVolumeAtConfiguredFeeUsd =
    unitRevenuePerUsdVol > 0 ? neededAfterBaselineUsd / unitRevenuePerUsdVol : Number.POSITIVE_INFINITY;

  const neededFromFeePoolUsd = Math.max(
    0,
    (dailyGrossIssuanceNear - dailyBaselineL1BurnNear - dailyIntentsIncrementalBurnNear) * safePrice
  );
  const breakEvenRequiredCaptureShareAtCurrentVolumePct =
    dailyIntentsFeePoolUsd > 0
      ? (neededFromFeePoolUsd / dailyIntentsFeePoolUsd) * 100
      : Number.POSITIVE_INFINITY;

  return {
    dailyGrossIssuanceNear,
    dailyGrossIssuanceUsd,
    annualGrossIssuanceNear,
    dailyBaselineL1BurnNear,
    dailyIntentsIncrementalBurnNear,
    dailyIntentsFeePoolUsd,
    dailyRoutedToNearUsd,
    dailyRoutedNearEquivalent,
    dailyTotalNearOffset,
    dailyNetIssuanceNear,
    netInflationPct,
    issuanceOffsetPct,
    annualizedAccrualYieldOnMcapPct,
    breakEvenDailyVolumeAtConfiguredFeeUsd,
    breakEvenRequiredCaptureShareAtCurrentVolumePct,
  };
}
