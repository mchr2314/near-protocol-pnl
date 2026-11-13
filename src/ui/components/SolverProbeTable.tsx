import type {
  ContractStorageLockup,
  NearAiCatalogSummary,
  QuoteProbeResult,
  ValidatorConsensusSnapshot,
} from '../types.js';
import { fmtNear, fmtPct, fmtUsd } from '../utils/format.js';

interface SolverProbeTableProps {
  tokenCount: number;
  chainCount: number;
  probes: readonly QuoteProbeResult[];
  lockups: readonly ContractStorageLockup[];
  totalLockupNear: number;
  consensus: ValidatorConsensusSnapshot;
  nearAiCatalog: NearAiCatalogSummary;
}

export function SolverProbeTable({
  tokenCount,
  chainCount,
  probes,
  lockups,
  totalLockupNear,
  consensus,
  nearAiCatalog,
}: SolverProbeTableProps) {
  const uniqueFeeRecipient =
    probes.find((p) => p.appFeeRecipient)?.appFeeRecipient ?? 'Not emitted';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Forensic Fee Routing Callout */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '14px 16px',
          fontSize: '13px',
          color: '#78350f',
        }}
      >
        <strong>Live 1Click Forensic Receipt:</strong> Across{' '}
        <span className="mono">{tokenCount}</span> supported tokens on{' '}
        <span className="mono">{chainCount}</span> blockchains, dry quotes attach default{' '}
        <span className="mono">appFees</span> (1 bps stable / 20 bps native) routed directly to
        implicit hex account <code className="mono">{uniqueFeeRecipient}</code> — verifying that swap
        protocol fees bypass <code className="mono">treasury.near</code> (RPC{' '}
        <span className="mono">
          protocol_reward_rate = [{consensus.protocolRewardRateRatio[0]},{' '}
          {consensus.protocolRewardRateRatio[1]}]
        </span>
        ).
      </div>

      {/* 1Click Live Cross-Chain Benchmarks */}
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700 }}>
          Live Unauthenticated 1Click Dry Quote Benchmarks ($10,000 Notional Exact-Input)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cross-Chain Route</th>
                <th>Origin Input</th>
                <th style={{ textAlign: 'right' }}>Quoted Output USD</th>
                <th style={{ textAlign: 'right' }}>Total Spread (bps)</th>
                <th style={{ textAlign: 'right' }}>App Fee</th>
                <th style={{ textAlign: 'right' }}>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {probes.map((p) => (
                <tr key={p.routeId}>
                  <td>
                    <strong>{p.label}</strong>
                  </td>
                  <td className="mono" style={{ fontSize: '12px' }}>
                    {p.amountInHuman}
                  </td>
                  <td className="num-right">{fmtUsd(p.amountOutUsd, 2)}</td>
                  <td
                    className="num-right"
                    style={{
                      color:
                        p.impliedSpreadBps !== null && p.impliedSpreadBps > 45
                          ? '#dc2626'
                          : '#047857',
                    }}
                  >
                    {p.impliedSpreadBps !== null ? `${p.impliedSpreadBps.toFixed(2)} bps` : '—'}
                  </td>
                  <td className="num-right">
                    {p.appFeeBps !== null && p.appFeeBps !== undefined ? `${p.appFeeBps} bps` : '—'}
                  </td>
                  <td className="num-right">
                    {p.estimatedTimeSec !== null ? `${p.estimatedTimeSec}s` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'ok' ? 'badge-green' : 'badge-red'}`}>
                      {p.status === 'ok' ? `HTTP ${p.httpStatus}` : p.note || 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* RPC Contract Storage Lockups */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
              State-Rent Storage Staking (RPC view_account)
            </h3>
            <span className="badge badge-blue mono">{fmtNear(totalLockupNear, 0)} locked</span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
            Every 100 KB of persistent contract state forces 1 NEAR out of circulating liquid float (
            {consensus.storageNearPer100Kb} NEAR / 100 KB).
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Storage Bytes</th>
                  <th style={{ textAlign: 'right' }}>Locked NEAR</th>
                </tr>
              </thead>
              <tbody>
                {lockups.map((c) => (
                  <tr key={c.accountId} className={c.accountId === 'intents.near' ? 'highlight-row' : undefined}>
                    <td className="mono" style={{ fontSize: '12px' }}>
                      {c.accountId}
                    </td>
                    <td>
                      <span className="badge">{c.category}</span>
                    </td>
                    <td className="num-right">
                      {c.storageUsageBytes.toLocaleString('en-US')}
                    </td>
                    <td className="num-right">{fmtNear(c.lockedNear, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validator Nakamoto & NEAR.AI Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                Validator Decentralization &amp; Security Budget
              </h3>
              <span className="badge badge-green mono">
                Nakamoto33={consensus.nakamoto33} | N50={consensus.nakamoto50}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div className="sim-stat-box">
                <div className="sim-stat-label">Active Validators</div>
                <div className="sim-stat-val mono" style={{ fontSize: '17px' }}>
                  {consensus.activeValidators}
                </div>
              </div>
              <div className="sim-stat-box">
                <div className="sim-stat-label">Total Staked</div>
                <div className="sim-stat-val mono" style={{ fontSize: '17px' }}>
                  {fmtNear(consensus.totalStakeNear, 0)}
                </div>
              </div>
              <div className="sim-stat-box">
                <div className="sim-stat-label">Top-5 Share</div>
                <div className="sim-stat-val mono" style={{ fontSize: '17px' }}>
                  {fmtPct(consensus.top5StakeSharePct, 2)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {consensus.topValidators.slice(0, 6).map((v) => (
                <div key={v.accountId} style={{ fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="mono">{v.accountId}</span>
                    <span className="mono">
                      {fmtNear(v.stakeNear, 0)} ({v.sharePct.toFixed(2)}%)
                    </span>
                  </div>
                  <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginTop: '2px' }}>
                    <div
                      style={{
                        width: `${Math.min(100, v.sharePct * 10)}%`,
                        height: '100%',
                        background: '#059669',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                NEAR.AI Cloud Supply Architecture ({nearAiCatalog.totalModels} Models)
              </h3>
              <span className="badge badge-blue mono">
                {nearAiCatalog.privateTeeModels} Private TEE / {nearAiCatalog.anonymisedProxyModels} Proxied
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
              Verifiable confidential hardware enclaves account for{' '}
              <strong>
                {fmtPct((nearAiCatalog.privateTeeModels / Math.max(1, nearAiCatalog.totalModels)) * 100, 1)}
              </strong>{' '}
              of listed models, while third-party frontier routes operate as anonymised off-chain proxies.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {nearAiCatalog.owners.map((o) => (
                <span
                  key={o.owner}
                  className={`badge ${o.trustTier === 'Anonymised Proxy' ? '' : 'badge-green'}`}
                >
                  {o.owner}: {o.count} ({o.trustTier})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
