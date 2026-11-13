import { useMemo, useState } from 'react';
import type { CorrelationWindow, DailyPairedPoint, WindowKey } from '../types.js';
import { fmtCount, fmtNear, fmtPct, fmtSignedR, fmtUsd } from '../utils/format.js';

interface HalvingChartProps {
  series: readonly DailyPairedPoint[];
  halvingCutoverDate: string;
}

export function HalvingInflationChart({ series, halvingCutoverDate }: HalvingChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Skip earliest warm-up points if inflation was computed on tiny window
  const data = useMemo(
    () => series.filter((d) => d.annualizedInflationPct > 0.5 && d.annualizedInflationPct < 9),
    [series]
  );

  const width = 820;
  const height = 270;
  const pad = { top: 20, right: 20, bottom: 34, left: 50 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minY = 1.5;
  const maxY = 6.0;

  const toX = (i: number) =>
    pad.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotW);
  const toY = (v: number) =>
    pad.top + ((maxY - Math.max(minY, Math.min(maxY, v))) / (maxY - minY)) * plotH;

  const pathD = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.annualizedInflationPct).toFixed(1)}`)
      .join(' ');
  }, [data]);

  const cutoverIdx = useMemo(
    () => data.findIndex((d) => d.date >= halvingCutoverDate),
    [data, halvingCutoverDate]
  );

  const activePoint = hoverIdx !== null && data[hoverIdx] ? data[hoverIdx] : data[data.length - 1];
  const activeIdx = hoverIdx !== null && data[hoverIdx] ? hoverIdx : Math.max(0, data.length - 1);

  if (data.length === 0) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '8px',
          fontSize: '12.5px',
          color: '#475569',
        }}
      >
        <span>
          Date: <strong className="mono">{activePoint.date}</strong> | 30d Annualized Issuance:{' '}
          <strong className="mono" style={{ color: '#047857' }}>
            {fmtPct(activePoint.annualizedInflationPct, 2)}
          </strong>
        </span>
        <span>
          Daily L1 Burn Offset:{' '}
          <strong className="mono">{fmtNear(activePoint.l1GasNear, 0)}</strong> (
          <strong className="mono">{fmtUsd(activePoint.l1FeeUsd, 0)}</strong>)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label="Annualized inflation rate before and after October 2025 halving"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          const frac = (relX - pad.left) / plotW;
          const idx = Math.max(0, Math.min(data.length - 1, Math.round(frac * (data.length - 1))));
          setHoverIdx(idx);
        }}
      >
        {[2.0, 2.5, 3.5, 5.0, 6.0].map((tick) => {
          const y = toY(tick);
          const isRef = tick === 5.0 || tick === 2.5;
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke={isRef ? '#94a3b8' : '#e2e8f0'}
                strokeDasharray={isRef ? '4 4' : undefined}
                strokeWidth={1}
              />
              <text
                x={pad.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
                className="mono"
              >
                {tick.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {cutoverIdx >= 0 && (
          <g>
            <line
              x1={toX(cutoverIdx)}
              x2={toX(cutoverIdx)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <text
              x={toX(cutoverIdx) + 6}
              y={pad.top + 14}
              fontSize="11"
              fontWeight={600}
              fill="#b45309"
            >
              Halving Cutover ({halvingCutoverDate})
            </text>
          </g>
        )}

        <path d={pathD} fill="none" stroke="#059669" strokeWidth={2.4} />

        {activePoint && (
          <g>
            <line
              x1={toX(activeIdx)}
              x2={toX(activeIdx)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <circle cx={toX(activeIdx)} cy={toY(activePoint.annualizedInflationPct)} r={4.5} fill="#047857" />
          </g>
        )}

        {[0, Math.floor(data.length / 2), data.length - 1].map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={height - 10}
            textAnchor={idx === 0 ? 'start' : idx === data.length - 1 ? 'end' : 'middle'}
            fontSize="11"
            fill="#64748b"
            className="mono"
          >
            {data[idx].date}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface SimpsonsProps {
  windows: readonly CorrelationWindow[];
  series: readonly DailyPairedPoint[];
  selectedWindow: WindowKey;
  onSelectWindow: (w: WindowKey) => void;
}

export function SimpsonsParadoxChart({
  windows,
  series,
  selectedWindow,
  onSelectWindow,
}: SimpsonsProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const current = windows.find((w) => w.windowKey === selectedWindow) ?? windows[0];

  const rollData = useMemo(
    () => series.filter((d) => d.rolling30dCorrVolVsTxns !== null),
    [series]
  );

  const width = 820;
  const height = 240;
  const pad = { top: 18, right: 20, bottom: 30, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const toX = (i: number) =>
    pad.left + (rollData.length <= 1 ? 0 : (i / (rollData.length - 1)) * plotW);
  const toY = (r: number) => pad.top + ((1 - Math.max(-1, Math.min(1, r))) / 2) * plotH;

  const corrPath = useMemo(() => {
    if (rollData.length === 0) return '';
    return rollData
      .map(
        (d, i) =>
          `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.rolling30dCorrVolVsTxns ?? 0).toFixed(1)}`
      )
      .join(' ');
  }, [rollData]);

  const hoverPoint =
    hoverIdx !== null && rollData[hoverIdx] ? rollData[hoverIdx] : rollData[rollData.length - 1];
  const activeIdx = hoverIdx !== null && rollData[hoverIdx] ? hoverIdx : Math.max(0, rollData.length - 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="seg-tabs" role="tablist" aria-label="Correlation cohort selector">
          {windows.map((w) => (
            <button
              key={w.windowKey}
              type="button"
              role="tab"
              aria-selected={selectedWindow === w.windowKey}
              className={`seg-btn ${selectedWindow === w.windowKey ? 'active' : ''}`}
              onClick={() => onSelectWindow(w.windowKey)}
            >
              {w.windowKey.toUpperCase()} ({w.days}d)
            </button>
          ))}
        </div>

        {current && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12.5px' }}>
            <span>
              r(Intents Vol, L1 Txns):{' '}
              <strong
                className="mono"
                style={{ color: current.rNiVolVsL1Txns >= 0 ? '#047857' : '#dc2626' }}
              >
                {fmtSignedR(current.rNiVolVsL1Txns)}
              </strong>
            </span>
            <span>
              Spearman rho:{' '}
              <strong className="mono">{fmtSignedR(current.rhoNiVolVsL1Txns)}</strong>
            </span>
            <span>
              r(Vol, L1 Fee USD):{' '}
              <strong className="mono">{fmtSignedR(current.rNiVolVsFeeUsd)}</strong>
            </span>
            <span>
              Cohort Intents Vol: <strong className="mono">{fmtUsd(current.niVolumeUsd)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Cohort bar comparison */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
        }}
      >
        {windows.map((w) => {
          const isPos = w.rNiVolVsL1Txns >= 0;
          const pct = Math.min(100, Math.abs(w.rNiVolVsL1Txns) * 100);
          return (
            <button
              key={w.windowKey}
              type="button"
              onClick={() => onSelectWindow(w.windowKey)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: selectedWindow === w.windowKey ? '1.5px solid #059669' : '1px solid #e2e8f0',
                background: selectedWindow === w.windowKey ? '#ecfdf5' : '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
                {w.label}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: '2px 0 6px',
                  color: isPos ? '#047857' : '#dc2626',
                }}
              >
                r = {fmtSignedR(w.rNiVolVsL1Txns)}
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: isPos ? '#059669' : '#dc2626',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {rollData.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
            30-Day Rolling Pearson r(Intents Daily Volume, L1 Txns) — Hover date:{' '}
            <strong className="mono">{hoverPoint.date}</strong> | Rolling r:{' '}
            <strong
              className="mono"
              style={{
                color: (hoverPoint.rolling30dCorrVolVsTxns ?? 0) >= 0 ? '#047857' : '#dc2626',
              }}
            >
              {fmtSignedR(hoverPoint.rolling30dCorrVolVsTxns)}
            </strong>{' '}
            | L1 Txns: <strong className="mono">{fmtCount(hoverPoint.l1Txns)}</strong> | Intents:{' '}
            <strong className="mono">{fmtUsd(hoverPoint.intentsVolumeUsd)}</strong>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="chart-svg"
            role="img"
            aria-label="30 day rolling Pearson correlation between Intents volume and L1 transactions"
            onMouseLeave={() => setHoverIdx(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * width;
              const frac = (relX - pad.left) / plotW;
              const idx = Math.max(0, Math.min(rollData.length - 1, Math.round(frac * (rollData.length - 1))));
              setHoverIdx(idx);
            }}
          >
            {[-1, -0.5, 0, 0.5, 1].map((tick) => {
              const y = toY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={y}
                    y2={y}
                    stroke={tick === 0 ? '#64748b' : '#e2e8f0'}
                    strokeDasharray={tick === 0 ? '4 4' : undefined}
                    strokeWidth={tick === 0 ? 1.3 : 1}
                  />
                  <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b" className="mono">
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <path d={corrPath} fill="none" stroke="#2563eb" strokeWidth={2.1} />

            {hoverPoint && (
              <g>
                <line
                  x1={toX(activeIdx)}
                  x2={toX(activeIdx)}
                  y1={pad.top}
                  y2={height - pad.bottom}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />
                <circle
                  cx={toX(activeIdx)}
                  cy={toY(hoverPoint.rolling30dCorrVolVsTxns ?? 0)}
                  r={4.5}
                  fill="#1d4ed8"
                />
              </g>
            )}

            {[0, Math.floor(rollData.length / 2), rollData.length - 1].map((idx) => (
              <text
                key={idx}
                x={toX(idx)}
                y={height - 8}
                textAnchor={idx === 0 ? 'start' : idx === rollData.length - 1 ? 'end' : 'middle'}
                fontSize="11"
                fill="#64748b"
                className="mono"
              >
                {rollData[idx].date}
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

interface FeeInversionChartProps {
  series: readonly DailyPairedPoint[];
}

export function FeeInversionChart({ series }: FeeInversionChartProps) {
  const [mode, setMode] = useState<'cumulative' | 'daily30'>('cumulative');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = useMemo(() => {
    if (mode === 'daily30') {
      return series.slice(-45).map((d) => ({
        date: d.date,
        intentsVal: d.intentsFeesUsd,
        l1Val: d.l1FeeUsd,
      }));
    }
    let cumNi = 0;
    let cumL1 = 0;
    return series.map((d) => {
      cumNi += d.intentsFeesUsd;
      cumL1 += d.l1FeeUsd;
      return {
        date: d.date,
        intentsVal: cumNi,
        l1Val: cumL1,
      };
    });
  }, [series, mode]);

  const maxVal = useMemo(() => {
    let m = 1;
    for (const p of points) {
      if (p.intentsVal > m) m = p.intentsVal;
      if (p.l1Val > m) m = p.l1Val;
    }
    return m;
  }, [points]);

  const width = 820;
  const height = 250;
  const pad = { top: 18, right: 20, bottom: 30, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const toX = (i: number) =>
    pad.left + (points.length <= 1 ? 0 : (i / (points.length - 1)) * plotW);
  const toY = (v: number) => pad.top + (1 - v / maxVal) * plotH;

  const niPath = useMemo(
    () =>
      points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.intentsVal).toFixed(1)}`)
        .join(' '),
    [points, maxVal]
  );

  const l1Path = useMemo(
    () =>
      points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.l1Val).toFixed(1)}`)
        .join(' '),
    [points, maxVal]
  );

  const hoverPoint =
    hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];
  const activeIdx = hoverIdx !== null && points[hoverIdx] ? hoverIdx : Math.max(0, points.length - 1);

  if (points.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div className="seg-tabs">
          <button
            type="button"
            className={`seg-btn ${mode === 'cumulative' ? 'active' : ''}`}
            onClick={() => {
              setMode('cumulative');
              setHoverIdx(null);
            }}
          >
            Cumulative Matched Pool (703d)
          </button>
          <button
            type="button"
            className={`seg-btn ${mode === 'daily30' ? 'active' : ''}`}
            onClick={() => {
              setMode('daily30');
              setHoverIdx(null);
            }}
          >
            Recent Daily Fees (45d)
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px' }}>
          <span>
            Date: <strong className="mono">{hoverPoint.date}</strong>
          </span>
          <span style={{ color: '#047857' }}>
            ● Intents Fees: <strong className="mono">{fmtUsd(hoverPoint.intentsVal)}</strong>
          </span>
          <span style={{ color: '#dc2626' }}>
            ● L1 Base Fees: <strong className="mono">{fmtUsd(hoverPoint.l1Val)}</strong>
          </span>
          <span>
            Ratio:{' '}
            <strong className="mono">
              {hoverPoint.l1Val > 0 ? `${(hoverPoint.intentsVal / hoverPoint.l1Val).toFixed(1)}x` : '—'}
            </strong>
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label="NEAR Intents fee pool compared with NEAR L1 base gas fees"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          const frac = (relX - pad.left) / plotW;
          const idx = Math.max(0, Math.min(points.length - 1, Math.round(frac * (points.length - 1))));
          setHoverIdx(idx);
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = maxVal * frac;
          const y = toY(val);
          return (
            <g key={frac}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b" className="mono">
                {fmtUsd(val)}
              </text>
            </g>
          );
        })}

        <path d={niPath} fill="none" stroke="#059669" strokeWidth={2.5} />
        <path d={l1Path} fill="none" stroke="#dc2626" strokeWidth={2.2} />

        {hoverPoint && (
          <g>
            <line
              x1={toX(activeIdx)}
              x2={toX(activeIdx)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <circle cx={toX(activeIdx)} cy={toY(hoverPoint.intentsVal)} r={4.5} fill="#047857" />
            <circle cx={toX(activeIdx)} cy={toY(hoverPoint.l1Val)} r={4.5} fill="#dc2626" />
          </g>
        )}

        {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={height - 8}
            textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
            fontSize="11"
            fill="#64748b"
            className="mono"
          >
            {points[idx].date}
          </text>
        ))}
      </svg>
    </div>
  );
}
