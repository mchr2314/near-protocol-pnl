import { useMemo, useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import type { PeerChainSnapshot, ProtocolBreakdownSnapshot } from '../types.js';
import { fmtPct, fmtUsd } from '../utils/format.js';

interface PeerMatrixProps {
  peers: readonly PeerChainSnapshot[];
  protocols: readonly ProtocolBreakdownSnapshot[];
}

type SortKey =
  | 'tvlUsd'
  | 'stablecoinMcapUsd'
  | 'fees30dUsd'
  | 'revenue30dUsd'
  | 'dexVolume30dUsd'
  | 'tvlTurnover24hPct';

export function PeerMatrix({ peers, protocols }: PeerMatrixProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tvlTurnover24hPct');
  const [desc, setDesc] = useState<boolean>(true);

  const sortedPeers = useMemo(() => {
    return [...peers].sort((a, b) => (desc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
  }, [peers, sortKey, desc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  };

  const colHeader = (label: string, key: SortKey) => (
    <th style={{ textAlign: 'right' }}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          color: sortKey === key ? '#0f172a' : 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        <ArrowDownUp size={11} />
      </button>
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>L1 / L2 Peer</th>
              {colHeader('DeFi TVL', 'tvlUsd')}
              {colHeader('Stablecoins', 'stablecoinMcapUsd')}
              {colHeader('Chain Fees 30d', 'fees30dUsd')}
              {colHeader('Chain Rev 30d', 'revenue30dUsd')}
              {colHeader('DEX Vol 30d', 'dexVolume30dUsd')}
              {colHeader('24h Vol / TVL', 'tvlTurnover24hPct')}
              <th style={{ textAlign: 'right' }}>Rev / Fees</th>
            </tr>
          </thead>
          <tbody>
            {sortedPeers.map((row) => (
              <tr key={row.chain} className={row.chain === 'Near' ? 'highlight-row' : undefined}>
                <td>
                  <strong>{row.chain}</strong>
                  {row.chain === 'Near' && (
                    <span className="badge badge-green" style={{ marginLeft: '8px' }}>
                      Base Asset
                    </span>
                  )}
                </td>
                <td className="num-right">{fmtUsd(row.tvlUsd)}</td>
                <td className="num-right">{fmtUsd(row.stablecoinMcapUsd)}</td>
                <td className="num-right">{fmtUsd(row.fees30dUsd)}</td>
                <td className="num-right">{fmtUsd(row.revenue30dUsd)}</td>
                <td className="num-right">{fmtUsd(row.dexVolume30dUsd)}</td>
                <td className="num-right" style={{ color: row.tvlTurnover24hPct > 60 ? '#047857' : undefined }}>
                  {fmtPct(row.tvlTurnover24hPct, 1)}
                </td>
                <td className="num-right">{fmtPct(row.feeCaptureRatioPct, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
          NEAR Ecosystem Value Disaggregation: Settlement Rail vs. Base Layer Gas
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Protocol / Layer</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Fees 24h</th>
                <th style={{ textAlign: 'right' }}>Fees 30d</th>
                <th style={{ textAlign: 'right' }}>Fees All-Time</th>
                <th style={{ textAlign: 'right' }}>DEX Vol 30d</th>
                <th style={{ textAlign: 'right' }}>Implied Fee</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.slug} className={p.slug === 'near-intents' ? 'highlight-row' : undefined}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="badge">{p.category}</span>
                  </td>
                  <td className="num-right">{fmtUsd(p.fees24hUsd)}</td>
                  <td className="num-right">{fmtUsd(p.fees30dUsd)}</td>
                  <td className="num-right">{fmtUsd(p.feesAllTimeUsd)}</td>
                  <td className="num-right">{fmtUsd(p.volume30dUsd)}</td>
                  <td className="num-right">
                    {p.impliedFeeBps !== null ? `${p.impliedFeeBps.toFixed(1)} bps` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
