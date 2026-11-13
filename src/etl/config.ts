import type { ContractCategory } from '../ui/types.js';

export const ENDPOINTS = {
  nearblocksCharts: 'https://api.nearblocks.io/v1/charts',
  nearblocksStats: 'https://api.nearblocks.io/v1/stats',
  nearRpcPrimary: process.env.NEAR_RPC_URL || 'https://free.rpc.fastnear.com',
  nearRpcFallback: 'https://rpc.mainnet.near.org',
  llamaChains: 'https://api.llama.fi/v2/chains',
  llamaFeesChain: (chain: string, dataType: 'dailyFees' | 'dailyRevenue') =>
    `https://api.llama.fi/summary/fees/${encodeURIComponent(chain)}?dataType=${dataType}`,
  llamaDexChain: (chain: string) =>
    `https://api.llama.fi/overview/dexs/${encodeURIComponent(chain)}?excludeTotalDataChart=true`,
  llamaStablecoinsChain: (chain: string) =>
    `https://stablecoins.llama.fi/stablecoincharts/${encodeURIComponent(chain)}`,
  llamaProtocolFees: (slug: string) =>
    `https://api.llama.fi/summary/fees/${encodeURIComponent(slug)}`,
  llamaProtocolDex: (slug: string) =>
    `https://api.llama.fi/summary/dexs/${encodeURIComponent(slug)}`,
  oneClickTokens: 'https://1click.chaindefuser.com/v0/tokens',
  oneClickQuote: 'https://1click.chaindefuser.com/v0/quote',
  nearAiModels: 'https://cloud-api.near.ai/v1/models',
} as const;

export const HALVING_CUTOVER_DATE = '2025-10-30';

export const TARGET_CONTRACTS: ReadonlyArray<{
  accountId: string;
  category: ContractCategory;
}> = [
  { accountId: 'intents.near', category: 'Intents Settlement' },
  { accountId: 'social.near', category: 'Identity & Social' },
  { accountId: 'wrap.near', category: 'Oracle & Core' },
  { accountId: 'v2.ref-finance.near', category: 'DeFi DEX' },
  { accountId: 'linear-protocol.near', category: 'Liquid Staking' },
  { accountId: 'meta-pool.near', category: 'Liquid Staking' },
  { accountId: 'v1.signer', category: 'MPC / Chain Signatures' },
  { accountId: 'priceoracle.near', category: 'Oracle & Core' },
];

export const PEER_CHAINS = ['Near', 'Solana', 'Base', 'Arbitrum', 'Sui', 'Aptos'] as const;

export const ECOSYSTEM_PROTOCOLS: ReadonlyArray<{
  slug: string;
  name: string;
  category: string;
  hasDexEndpoint: boolean;
}> = [
  { slug: 'near-intents', name: 'NEAR Intents', category: 'Cross-Chain Solver / Settlement', hasDexEndpoint: true },
  { slug: 'rhea-finance', name: 'Rhea Finance (Combined)', category: 'NEAR Native DeFi Suite', hasDexEndpoint: false },
  { slug: 'rhea-dex', name: 'Rhea DEX', category: 'NEAR Native AMM', hasDexEndpoint: true },
  { slug: 'burrow', name: 'Burrow / Rhea Lend', category: 'Money Market', hasDexEndpoint: false },
  { slug: 'meta-pool', name: 'Meta Pool', category: 'Liquid Staking', hasDexEndpoint: false },
];

export interface QuoteRouteTemplate {
  routeId: string;
  label: string;
  originBlockchain: string;
  originSymbol: string;
  destBlockchain: string;
  destSymbol: string;
  targetNotionalUsd: number;
  refundTo: string;
  recipient: string;
}

export const ONECLICK_PROBE_ROUTES: ReadonlyArray<QuoteRouteTemplate> = [
  {
    routeId: 'base-usdc-to-arb-usdc',
    label: 'Base USDC -> Arbitrum USDC ($10k)',
    originBlockchain: 'base',
    originSymbol: 'USDC',
    destBlockchain: 'arb',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'eth-usdc-to-base-usdc',
    label: 'Ethereum USDC -> Base USDC ($10k)',
    originBlockchain: 'eth',
    originSymbol: 'USDC',
    destBlockchain: 'base',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'arb-usdc-to-bsc-usdc',
    label: 'Arbitrum USDC -> BSC USDC ($10k)',
    originBlockchain: 'arb',
    originSymbol: 'USDC',
    destBlockchain: 'bsc',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'btc-to-base-usdc',
    label: 'Bitcoin BTC -> Base USDC ($10k)',
    originBlockchain: 'btc',
    originSymbol: 'BTC',
    destBlockchain: 'base',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'sol-to-base-usdc',
    label: 'Solana SOL -> Base USDC ($10k)',
    originBlockchain: 'sol',
    originSymbol: 'SOL',
    destBlockchain: 'base',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'sui-to-base-usdc',
    label: 'Sui SUI -> Base USDC ($10k)',
    originBlockchain: 'sui',
    originSymbol: 'SUI',
    destBlockchain: 'base',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: '0x0000000000000000000000000000000000000000000000000000000000000002',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    routeId: 'near-to-base-usdc',
    label: 'NEAR wNEAR -> Base USDC ($10k)',
    originBlockchain: 'near',
    originSymbol: 'wNEAR',
    destBlockchain: 'base',
    destSymbol: 'USDC',
    targetNotionalUsd: 10_000,
    refundTo: 'root.near',
    recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
];
