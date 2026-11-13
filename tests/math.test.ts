import { describe, expect, it } from 'vitest';
import {
  annualizedInflationPct,
  computeNakamoto,
  pearsonCorrelation,
  rollingCorrelation,
  simulateProtocolPnl,
  spearmanCorrelation,
  yoctoToNear,
} from '../src/etl/math.js';

describe('math primitives & statistical invariants', () => {
  it('computes exact Pearson correlation and clamps numerical edge cases', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
    expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
    expect(pearsonCorrelation([1, 1, 1], [2, 4, 6])).toBe(0);
    expect(pearsonCorrelation([1], [1])).toBe(0);
  });

  it('demonstrates Simpson paradox algebraically: negative pooled correlation vs positive subgroup correlations', () => {
    // Subgroup A (early high-spam L1, near-zero Intents)
    const earlyX = [1, 2, 3, 4, 5];
    const earlyY = [100, 102, 104, 106, 108];
    // Subgroup B (post-migration lower L1 baseline, high Intents)
    const lateX = [20, 22, 24, 26, 28];
    const lateY = [20, 22, 24, 26, 28];

    const rEarly = pearsonCorrelation(earlyX, earlyY);
    const rLate = pearsonCorrelation(lateX, lateY);
    const rPooled = pearsonCorrelation([...earlyX, ...lateX], [...earlyY, ...lateY]);

    expect(rEarly).toBeGreaterThan(0.99);
    expect(rLate).toBeGreaterThan(0.99);
    expect(rPooled).toBeLessThan(-0.9);
  });

  it('computes Spearman rank correlation accurately including ties', () => {
    expect(spearmanCorrelation([10, 20, 30, 40], [1, 100, 1000, 10000])).toBeCloseTo(1, 10);
    expect(spearmanCorrelation([1, 2, 2, 4], [4, 3, 3, 1])).toBeCloseTo(-1, 10);
  });

  it('computes fixed-window rolling Pearson correlation', () => {
    const xs = [1, 2, 3, 4, 5, 4, 3];
    const ys = [2, 4, 6, 8, 10, 8, 6];
    const rolling = rollingCorrelation(xs, ys, 3);
    expect(rolling[0]).toBeNull();
    expect(rolling[1]).toBeNull();
    expect(rolling[2]).toBeCloseTo(1, 8);
    expect(rolling[6]).toBeCloseTo(1, 8);
  });

  it('computes annualized inflation % cleanly across 365d and 30d spans', () => {
    expect(annualizedInflationPct(1_000_000, 1_025_000, 365)).toBeCloseTo(2.5, 8);
    expect(annualizedInflationPct(1_000_000, 1_002_054.794520548, 30)).toBeCloseTo(2.5, 4);
  });

  it('computes Nakamoto coefficients (33.3% & 50.0%) and top-5 concentration', () => {
    const stakes = [30, 25, 20, 15, 5, 5]; // total = 100
    const res = computeNakamoto(stakes);
    expect(res.totalStakeNear).toBe(100);
    expect(res.top5StakeSharePct).toBeCloseTo(95, 8);
    expect(res.nakamoto33).toBe(2); // 30 <= 33.33, 30+25=55 > 33.33
    expect(res.nakamoto50).toBe(2); // 30+25=55 > 50
  });

  it('converts huge yoctoNEAR integers to floating NEAR without overflow', () => {
    expect(yoctoToNear('1000000000000000000000000')).toBeCloseTo(1, 6);
    expect(yoctoToNear('137191500000000000000000000000')).toBeCloseTo(137191.5, 1);
    expect(yoctoToNear('0')).toBe(0);
  });

  it('simulates Protocol P&L consistently under zero capture vs full buyback-burn parity', () => {
    const base = simulateProtocolPnl({
      nearPriceUsd: 3.5,
      totalSupplyNear: 1_311_000_000,
      maxInflationPct: 2.5,
      dailyL1GasBurnNear: 1_000,
      intentsDailyVolumeUsd: 120_000_000,
      intentsProtocolFeeBps: 16,
      nearAccrualSharePct: 0,
      l1SettleTxnsPerSwap: 1,
      l1GasPerSettleNear: 0.002,
    });
    expect(base.dailyRoutedToNearUsd).toBe(0);
    expect(base.netInflationPct).toBeGreaterThan(2.4);
    expect(base.issuanceOffsetPct).toBeLessThan(3);

    const routed = simulateProtocolPnl({
      nearPriceUsd: 3.5,
      totalSupplyNear: 1_311_000_000,
      maxInflationPct: 2.5,
      dailyL1GasBurnNear: 1_000,
      intentsDailyVolumeUsd: 120_000_000,
      intentsProtocolFeeBps: 16,
      nearAccrualSharePct: 100,
      l1SettleTxnsPerSwap: 1,
      l1GasPerSettleNear: 0.002,
    });
    expect(routed.dailyRoutedToNearUsd).toBeCloseTo(192_000, 4);
    expect(routed.netInflationPct).toBeLessThan(base.netInflationPct);
    expect(routed.issuanceOffsetPct).toBeGreaterThan(50);
  });
});
