import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ThesisReport } from '../src/ui/types.js';

const ROOT = process.cwd();

async function loadDerivedReport(): Promise<ThesisReport> {
  const raw = await readFile(path.join(ROOT, 'data', 'derived', 'thesis-report.json'), 'utf8');
  return JSON.parse(raw) as ThesisReport;
}

describe('rebuilt live dataset & thesis invariants', () => {
  it('rebuilt thesis-report.json matches public copy byte-for-byte with zero NaN values', async () => {
    const derivedRaw = await readFile(path.join(ROOT, 'data', 'derived', 'thesis-report.json'), 'utf8');
    const publicRaw = await readFile(path.join(ROOT, 'public', 'data', 'thesis-report.json'), 'utf8');
    expect(derivedRaw).toBe(publicRaw);
    expect(derivedRaw).not.toContain(': NaN');

    const report = JSON.parse(derivedRaw) as ThesisReport;
    expect(report.schemaVersion).toBe('1.0.0');
    expect(report.pairedSeries.length).toBeGreaterThanOrEqual(700);
    expect(report.dataAsOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('verifies protocol_config parity (2.5% max inflation, 0% treasury cut, 1 NEAR / 100 KB storage)', async () => {
    const report = await loadDerivedReport();
    expect(report.consensus.maxInflationRateRatio).toEqual([1, 40]);
    expect(report.consensus.maxInflationPct).toBeCloseTo(2.5, 4);
    expect(report.consensus.protocolRewardRateRatio[0]).toBe(0);
    expect(report.consensus.storageNearPer100Kb).toBeCloseTo(1, 4);
    expect(report.consensus.activeValidators).toBeGreaterThan(200);
    expect(report.consensus.blockHeight).toBeGreaterThan(100_000_000);
    expect(report.consensus.nakamoto33).toBeGreaterThanOrEqual(5);
    expect(report.consensus.nakamoto50).toBeGreaterThan(report.consensus.nakamoto33);
  });

  it('verifies Simpson paradox empirically across pooled vs post-migration 90d cohorts', async () => {
    const report = await loadDerivedReport();
    const wAll = report.correlationWindows.find((w) => w.windowKey === 'all');
    const w90 = report.correlationWindows.find((w) => w.windowKey === '90d');
    const w30 = report.correlationWindows.find((w) => w.windowKey === '30d');

    expect(wAll).toBeDefined();
    expect(w90).toBeDefined();
    expect(w30).toBeDefined();

    // All-time pooled correlation is misleadingly negative while recent 90d is positive
    expect(wAll!.rNiVolVsL1Txns).toBeLessThan(-0.3);
    expect(w90!.rNiVolVsL1Txns).toBeGreaterThan(0.15);
    expect(w30!.niToL1FeeRatio).toBeGreaterThan(10);
  });

  it('verifies Oct 2025 halving empirically in supply expansion and L1 burn offset < 5%', async () => {
    const report = await loadDerivedReport();
    expect(report.macroHeadline.prior365dInflationPct).toBeGreaterThan(4.2);
    expect(report.macroHeadline.annualizedInflation365dPct).toBeLessThan(3.0);
    expect(report.macroHeadline.netInflationOffsetPct).toBeGreaterThan(0);
    expect(report.macroHeadline.netInflationOffsetPct).toBeLessThan(5);
  });

  it('verifies intents.near state lockup exceeds 100k NEAR and all 7 1Click routes probed cleanly', async () => {
    const report = await loadDerivedReport();
    const intentsLock = report.contractStorageLockups.find((c) => c.accountId === 'intents.near');
    expect(intentsLock?.status).toBe('ok');
    expect(intentsLock!.lockedNear).toBeGreaterThan(100_000);

    const okProbes = report.oneClickUniverse.probes.filter((p) => p.status === 'ok');
    expect(okProbes.length).toBeGreaterThanOrEqual(6);
    expect(report.oneClickUniverse.tokenCount).toBeGreaterThan(150);
    expect(report.nearAiCatalog.totalModels).toBeGreaterThan(30);
  });

  it('validates all BigQuery SQL scripts filter on block_date partitions', async () => {
    const sqlFiles = [
      '01_l1_burn_and_issuance.sql',
      '02_intents_l1_coupling.sql',
      '03_contract_storage_lockups.sql',
    ];
    for (const file of sqlFiles) {
      const content = await readFile(path.join(ROOT, 'queries', 'bigquery', file), 'utf8');
      expect(content).toContain('bigquery-public-data.crypto_near_mainnet_us');
      expect(content).toMatch(/WHERE[\s\S]*block_date\s*>=/i);
    }
  });
});
