import { useState } from 'react';
import type {
  FalsificationThreshold,
  MacroHeadline,
  NonComputableDisclosure,
} from '../types.js';
import { fmtNear, fmtPct, fmtUsd } from '../utils/format.js';

interface ThesisReaderProps {
  headline: MacroHeadline;
  thresholds: readonly FalsificationThreshold[];
  disclosures: readonly NonComputableDisclosure[];
}

const BIGQUERY_SNIPPETS: Record<string, string> = {
  '01_l1_burn_and_issuance.sql': `DECLARE start_date DATE DEFAULT DATE '2024-12-10';
DECLARE halving_date DATE DEFAULT DATE '2025-10-30';

WITH daily_outcomes AS (
  SELECT eo.block_date AS utc_date,
    SUM(SAFE_CAST(eo.tokens_burnt AS NUMERIC)) / 1e24 AS l1_tokens_burnt_near
  FROM \`bigquery-public-data.crypto_near_mainnet_us.execution_outcomes\` AS eo
  WHERE eo.block_date >= start_date
  GROUP BY eo.block_date
) ...`,
  '02_intents_l1_coupling.sql': `SELECT eo.block_date AS utc_date,
  SUM(IF(eo.executor_account_id = 'intents.near', SAFE_CAST(eo.tokens_burnt AS NUMERIC) / 1e24, 0)) AS intents_near_burnt,
  SUM(SAFE_CAST(eo.tokens_burnt AS NUMERIC) / 1e24) AS total_l1_near_burnt
FROM \`bigquery-public-data.crypto_near_mainnet_us.execution_outcomes\` AS eo
WHERE eo.block_date >= DATE '2024-12-10'
GROUP BY utc_date;`,
  '03_contract_storage_lockups.sql': `SELECT r.receiver_account_id AS contract_account,
  COUNT(*) AS receipts_90d,
  SUM(SAFE_CAST(eo.tokens_burnt AS NUMERIC)) / 1e24 AS tokens_burnt_near_90d
FROM \`bigquery-public-data.crypto_near_mainnet_us.receipts\` AS r
JOIN \`bigquery-public-data.crypto_near_mainnet_us.execution_outcomes\` AS eo
  ON r.receipt_id = eo.receipt_id AND r.block_date = eo.block_date
WHERE r.block_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  AND r.receiver_account_id IN ('intents.near', 'social.near', 'v1.signer', 'wrap.near')
GROUP BY r.receiver_account_id;`,
};

export function ThesisReader({ headline, thresholds, disclosures }: ThesisReaderProps) {
  const [selectedSql, setSelectedSql] = useState<string>('01_l1_burn_and_issuance.sql');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <section className="card prose-section">
        <div className="banner-eyebrow">Investment Committee Memo (Zero-Hype Assessment)</div>
        <h2 className="card-title" style={{ fontSize: '20px' }}>
          Execution Moat Established, Value Accrual Switch Still Unwired
        </h2>
        <p>
          <strong>Core Claim:</strong> NEAR Protocol has validated product-market fit as a chain-abstracted
          execution layer — driving <strong>{fmtUsd(headline.intentsVol30dUsd)}</strong> in 30-day
          Intents volume and generating <strong>{fmtUsd(headline.intentsFee30dUsd)}</strong> in
          monthly protocol fees (<strong>{headline.intentsToL1FeeRatio30d.toFixed(1)}x</strong>{' '}
          monthly L1 base fees). Yet at the protocol P&amp;L level,{' '}
          <strong>
            {fmtNear(headline.dailyL1GasBurnNear, 0)}/day ({fmtUsd(headline.dailyL1FeeUsd, 0)}/day)
          </strong>{' '}
          in L1 gas burn offsets only <strong>{fmtPct(headline.netInflationOffsetPct, 2)}</strong> of
          post-halving gross staking issuance ({fmtNear(headline.dailyGrossIssuanceNear, 0)}/day).
        </p>

        <div className="grid-2">
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px' }}>
            <h3 style={{ marginTop: 0, color: '#065f46' }}>What Supports the Bull Case</h3>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li>
                <strong>50% Inflation Cut Already Shipped:</strong> Annualized supply growth fell from{' '}
                <span className="mono">{fmtPct(headline.prior365dInflationPct, 2)}</span> to{' '}
                <span className="mono">{fmtPct(headline.annualizedInflation365dPct, 2)}</span> after the
                October 2025 governance cutover.
              </li>
              <li>
                <strong>Simpson’s Paradox Debunked:</strong> Pooled all-time regression wrongly
                suggests Intents decoupled from L1 (legacy consumer app decay overlapped Intents scaling).
                Recent 90-day correlation confirms transaction coupling while volume exceeds $3.7B/month.
              </li>
              <li>
                <strong>Best-in-Class Capital Efficiency:</strong> NEAR sustains over 100% daily DEX
                turnover vs. TVL with 136k+ NEAR locked solely in <code className="mono">intents.near</code>{' '}
                state storage. Turning on a 50% fee switch would flip the token P&amp;L rapidly.
              </li>
            </ul>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b' }}>What Cuts Against NEAR ($NEAR Equity Accrual)</h3>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li>
                <strong>Zero Automated Value Capture:</strong> Live RPC confirms{' '}
                <code className="mono">protocol_reward_rate = [0, 1]</code>, and live 1Click API quotes
                route swap <code className="mono">appFees</code> to an opaque implicit hex account rather
                than programmatic $NEAR burn.
              </li>
              <li>
                <strong>Gas Subsidy Paradox:</strong> NEAR L1 costs ~${(headline.dailyL1FeeUsd / 890_000).toFixed(4)}
                /tx. Even doubling daily transactions leaves issuance dilution above ~2.4%/yr unless swap
                bps fees share upside with $NEAR holders.
              </li>
              <li>
                <strong>Shallow Native Token Depth:</strong> Cross-chain quotes for <code className="mono">wNEAR</code>{' '}
                show ~72 bps total spread vs. 20.8 bps on Solana SOL for the same $10k exit to Base USDC.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
          Objective Falsification &amp; Re-Rating Ledger (Evaluated Live Against Latest Data)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Condition / Trigger</th>
                <th>Live Observed Metric</th>
                <th>Threshold to Flip View</th>
                <th>Current State</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.explanation}</div>
                  </td>
                  <td className="mono" style={{ fontSize: '12px' }}>{t.currentValueFormatted}</td>
                  <td className="mono" style={{ fontSize: '12px' }}>{t.thresholdFormatted}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.status === 'Bullish Confirmed'
                          ? 'badge-green'
                          : t.status === 'Bearish Confirmed'
                            ? 'badge-red'
                            : 'badge-amber'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
          Explicit Non-Computable Data Gaps (Honesty &amp; Scope Boundaries)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unavailable Metric</th>
                <th>Why Excluded From Zero-Key ETL</th>
                <th>How to Unlock</th>
              </tr>
            </thead>
            <tbody>
              {disclosures.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.metric}</strong></td>
                  <td style={{ fontSize: '12.5px', color: '#475569' }}>{d.reason}</td>
                  <td style={{ fontSize: '12.5px', color: '#047857' }}>{d.unlockCondition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            Reproducible Partition-Filtered BigQuery SQL (<code className="mono">crypto_near_mainnet_us</code>)
          </h3>
          <div className="seg-tabs">
            {Object.keys(BIGQUERY_SNIPPETS).map((fname) => (
              <button
                key={fname}
                type="button"
                className={`seg-btn ${selectedSql === fname ? 'active' : ''}`}
                onClick={() => setSelectedSql(fname)}
              >
                {fname}
              </button>
            ))}
          </div>
        </div>
        <pre className="provenance-code" style={{ margin: 0, fontSize: '12px', lineHeight: 1.55 }}>
          {BIGQUERY_SNIPPETS[selectedSql]}
        </pre>
      </section>
    </div>
  );
}
