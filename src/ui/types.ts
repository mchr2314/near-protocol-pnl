export type WindowKey = '30d' | '90d' | '180d' | 'all';

export interface CorrelationWindow {
  windowKey: WindowKey;
  label: string;
  days: number;
  startDate: string;
  endDate: string;
  niVolumeUsd: number;
  niFeesUsd: number;
  l1FeesUsd: number;
  l1GasBurnNear: number;
  niToL1FeeRatio: number;
  rNiVolVsL1Txns: number;
  rhoNiVolVsL1Txns: number;
  rNiVolVsActiveAccounts: number;
  rNiVolVsGasNear: number;
  rNiVolVsFeeUsd: number;
  rNiVolVsNearPrice: number;
  avgDailyTxns: number;
  avgDailyFeeUsd: number;
}

export interface DailyPairedPoint {
  date: string;
  nearPriceUsd: number;
  marketCapUsd: number;
  totalSupplyNear: number;
  circulatingSupplyNear: number;
  supplyDeltaNear: number;
  annualizedInflationPct: number;
  l1Txns: number;
  l1ActiveAccounts: number;
  l1GasNear: number;
  l1TxnFeeNear: number;
  l1FeeUsd: number;
  intentsVolumeUsd: number;
  intentsFeesUsd: number;
  rheaFinanceFeesUsd: number;
  burrowFeesUsd: number;
  rolling30dCorrVolVsTxns: number | null;
  rolling30dCorrVolVsFeeUsd: number | null;
}

export interface ValidatorEntry {
  accountId: string;
  stakeNear: number;
  sharePct: number;
}

export interface ValidatorConsensusSnapshot {
  blockHeight: number;
  epochStartHeight: number;
  epochLengthBlocks: number;
  seatCount: number;
  activeValidators: number;
  totalStakeNear: number;
  top5StakeSharePct: number;
  nakamoto33: number;
  nakamoto50: number;
  maxInflationRateRatio: [number, number];
  maxInflationPct: number;
  protocolRewardRateRatio: [number, number];
  protocolTreasurySharePct: number;
  storageAmountPerByteYocto: string;
  storageNearPer100Kb: number;
  topValidators: ValidatorEntry[];
}

export type ContractCategory =
  | 'Intents Settlement'
  | 'Identity & Social'
  | 'DeFi DEX'
  | 'Liquid Staking'
  | 'MPC / Chain Signatures'
  | 'Oracle & Core';

export interface ContractStorageLockup {
  accountId: string;
  category: ContractCategory;
  storageUsageBytes: number;
  lockedNear: number;
  liquidBalanceNear: number;
  codeHash: string;
  status: 'ok' | 'error';
  error?: string;
}

export interface PeerChainSnapshot {
  chain: string;
  tvlUsd: number;
  stablecoinMcapUsd: number;
  fees24hUsd: number;
  fees30dUsd: number;
  revenue24hUsd: number;
  revenue30dUsd: number;
  dexVolume24hUsd: number;
  dexVolume30dUsd: number;
  tvlTurnover24hPct: number;
  annualizedFeesToTvlPct: number;
  annualizedRevenueToTvlPct: number;
  feeCaptureRatioPct: number;
}

export interface ProtocolBreakdownSnapshot {
  slug: string;
  name: string;
  category: string;
  fees24hUsd: number | null;
  fees7dUsd: number | null;
  fees30dUsd: number | null;
  feesAllTimeUsd: number | null;
  volume24hUsd: number | null;
  volume30dUsd: number | null;
  volumeAllTimeUsd: number | null;
  impliedFeeBps: number | null;
}

export interface QuoteProbeResult {
  routeId: string;
  label: string;
  originAsset: string;
  destinationAsset: string;
  amountInHuman: string;
  amountInUsd: number | null;
  amountOutUsd: number | null;
  impliedSpreadBps: number | null;
  estimatedTimeSec: number | null;
  appFeeBps?: number | null;
  appFeeRecipient?: string | null;
  status: 'ok' | 'unavailable';
  httpStatus: number;
  note?: string;
}

export interface NearAiOwnerSummary {
  owner: string;
  count: number;
  trustTier: 'TEE Enclave' | 'Attested 3P' | 'Anonymised Proxy';
}

export interface NearAiSampleModel {
  id: string;
  owner: string;
  contextLength: number | null;
  inputPerMUsd: number | null;
  outputPerMUsd: number | null;
}

export interface NearAiCatalogSummary {
  totalModels: number;
  privateTeeModels: number;
  anonymisedProxyModels: number;
  owners: NearAiOwnerSummary[];
  sampleModels: NearAiSampleModel[];
}

export interface FalsificationThreshold {
  id: string;
  title: string;
  status: 'Bullish Confirmed' | 'Bearish Confirmed' | 'Not Yet Triggered';
  metricLabel: string;
  currentValueFormatted: string;
  thresholdFormatted: string;
  triggered: boolean;
  explanation: string;
}

export interface NonComputableDisclosure {
  id: string;
  metric: string;
  reason: string;
  unlockCondition: string;
}

export interface ProvenanceRecord {
  chartId: string;
  title: string;
  plainSentence: string;
  endpoints: string[];
  bigqueryFile: string;
  methodology: string;
}

export interface MacroHeadline {
  nearPriceUsd: number;
  marketCapUsd: number;
  totalSupplyNear: number;
  circulatingSupplyNear: number;
  annualizedInflation365dPct: number;
  prior365dInflationPct: number;
  dailyGrossIssuanceNear: number;
  dailyGrossIssuanceUsd: number;
  dailyL1GasBurnNear: number;
  dailyL1FeeUsd: number;
  netInflationOffsetPct: number;
  intentsVol24hUsd: number;
  intentsVol30dUsd: number;
  intentsVolAllTimeUsd: number;
  intentsFee24hUsd: number;
  intentsFee30dUsd: number;
  intentsFeeAllTimeUsd: number;
  l1Fee30dUsd: number;
  intentsToL1FeeRatio24h: number;
  intentsToL1FeeRatio30d: number;
  intentsBlendedBps30d: number;
  l1StablecoinMcapUsd: number;
  nearTvlUsd: number;
}

export interface HistoricalInflationPoint {
  date: string;
  totalSupplyNear: number;
  annualizedInflationPct: number;
  label: string;
}

export interface ThesisReport {
  schemaVersion: '1.0.0';
  generatedAtUtc: string;
  dataAsOfDate: string;
  halvingCutoverDate: string;
  macroHeadline: MacroHeadline;
  consensus: ValidatorConsensusSnapshot;
  contractStorageLockups: ContractStorageLockup[];
  totalLockupNearSampled: number;
  correlationWindows: CorrelationWindow[];
  pairedSeries: DailyPairedPoint[];
  historicalInflationSnapshots: HistoricalInflationPoint[];
  peerChains: PeerChainSnapshot[];
  ecosystemProtocols: ProtocolBreakdownSnapshot[];
  oneClickUniverse: {
    tokenCount: number;
    chainCount: number;
    probes: QuoteProbeResult[];
  };
  nearAiCatalog: NearAiCatalogSummary;
  falsificationThresholds: FalsificationThreshold[];
  nonComputableDisclosures: NonComputableDisclosure[];
  provenance: ProvenanceRecord[];
}

export interface PnlSimulationInput {
  nearPriceUsd: number;
  totalSupplyNear: number;
  maxInflationPct: number;
  dailyL1GasBurnNear: number;
  intentsDailyVolumeUsd: number;
  intentsProtocolFeeBps: number;
  nearAccrualSharePct: number;
  l1SettleTxnsPerSwap: number;
  l1GasPerSettleNear: number;
}

export interface PnlSimulationResult {
  dailyGrossIssuanceNear: number;
  dailyGrossIssuanceUsd: number;
  annualGrossIssuanceNear: number;
  dailyBaselineL1BurnNear: number;
  dailyIntentsIncrementalBurnNear: number;
  dailyIntentsFeePoolUsd: number;
  dailyRoutedToNearUsd: number;
  dailyRoutedNearEquivalent: number;
  dailyTotalNearOffset: number;
  dailyNetIssuanceNear: number;
  netInflationPct: number;
  issuanceOffsetPct: number;
  annualizedAccrualYieldOnMcapPct: number;
  breakEvenDailyVolumeAtConfiguredFeeUsd: number;
  breakEvenRequiredCaptureShareAtCurrentVolumePct: number;
}
