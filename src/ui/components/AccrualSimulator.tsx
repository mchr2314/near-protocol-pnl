import { useMemo, useState } from 'react';
import { simulateProtocolPnl } from '../../etl/math.js';
import type { MacroHeadline } from '../types.js';
import { fmtNear, fmtPct, fmtUsd } from '../utils/format.js';

interface AccrualSimulatorProps {
  headline: MacroHeadline;
  maxInflationPct: number;
}

export function AccrualSimulator({ headline, maxInflationPct }: AccrualSimulatorProps) {
  const defaultDailyIntentsVol = Math.round(headline.intentsVol30dUsd / 30);

  const [intentsDailyVolumeUsd, setIntentsDailyVolumeUsd] = useState<number>(defaultDailyIntentsVol);
  const [intentsProtocolFeeBps, setIntentsProtocolFeeBps] = useState<number>(
    Number(headline.intentsBlendedBps30d.toFixed(1)) || 16
  );
  const [nearAccrualSharePct, setNearAccrualSharePct] = useState<number>(0);
  const [l1SettleTxnsPerSwap, setL1SettleTxnsPerSwap] = useState<number>(1);

  const sim = useMemo(
    () =>
      simulateProtocolPnl({
        nearPriceUsd: headline.nearPriceUsd,
        totalSupplyNear: headline.totalSupplyNear,
        maxInflationPct,
        dailyL1GasBurnNear: headline.dailyL1GasBurnNear,
        intentsDailyVolumeUsd,
        intentsProtocolFeeBps,
        nearAccrualSharePct,
        l1SettleTxnsPerSwap,
        l1GasPerSettleNear: 0.002,
      }),
    [
      headline,
      maxInflationPct,
      intentsDailyVolumeUsd,
      intentsProtocolFeeBps,
      nearAccrualSharePct,
      l1SettleTxnsPerSwap,
    ]
  );

  const applyPreset = (vol: number, bps: number, share: number, txns: number) => {
    setIntentsDailyVolumeUsd(vol);
    setIntentsProtocolFeeBps(bps);
    setNearAccrualSharePct(share);
    setL1SettleTxnsPerSwap(txns);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          className="seg-btn"
          style={{ border: '1px solid #cbd5e1', background: '#f8fafc' }}
          onClick={() => applyPreset(defaultDailyIntentsVol, 16, 0, 1)}
        >
          1. Status Quo (0% Fee Switch)
        </button>
        <button
          type="button"
          className="seg-btn"
          style={{ border: '1px solid #cbd5e1', background: '#f8fafc' }}
          onClick={() => applyPreset(defaultDailyIntentsVol, 16, 25, 1)}
        >
          2. Modest 25% Protocol Buyback
        </button>
        <button
          type="button"
          className="seg-btn"
          style={{ border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#065f46' }}
          onClick={() => applyPreset(350_000_000, 16, 60, 1)}
        >
          3. $350M/d Vol + 60% Burn Switch
        </button>
        <button
          type="button"
          className="seg-btn"
          style={{ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af' }}
          onClick={() => applyPreset(220_000_000, 16, 97, 2)}
        >
          4. Hyperliquid-Style 97% Assistance Fund
        </button>
      </div>

      <div className="sim-layout">
        <div className="slider-group">
          <div className="slider-row">
            <div className="slider-label-line">
              <span>Daily NEAR Intents Volume</span>
              <span className="mono">{fmtUsd(intentsDailyVolumeUsd)}/day</span>
            </div>
            <input
              type="range"
              min={20_000_000}
              max={1_000_000_000}
              step={10_000_000}
              value={intentsDailyVolumeUsd}
              onChange={(e) => setIntentsDailyVolumeUsd(Number(e.target.value))}
            />
          </div>

          <div className="slider-row">
            <div className="slider-label-line">
              <span>Blended Solver / Protocol Fee Rate</span>
              <span className="mono">{intentsProtocolFeeBps.toFixed(1)} bps</span>
            </div>
            <input
              type="range"
              min={2}
              max={35}
              step={0.5}
              value={intentsProtocolFeeBps}
              onChange={(e) => setIntentsProtocolFeeBps(Number(e.target.value))}
            />
          </div>

          <div className="slider-row">
            <div className="slider-label-line">
              <span>Programmatic Share Routed to $NEAR Burn/Buyback</span>
              <span className="mono" style={{ color: nearAccrualSharePct > 0 ? '#047857' : '#dc2626' }}>
                {nearAccrualSharePct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={nearAccrualSharePct}
              onChange={(e) => setNearAccrualSharePct(Number(e.target.value))}
            />
          </div>

          <div className="slider-row">
            <div className="slider-label-line">
              <span>Incremental L1 Settlement Txns per Swap (~0.002 NEAR burn)</span>
              <span className="mono">{l1SettleTxnsPerSwap} tx</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={l1SettleTxnsPerSwap}
              onChange={(e) => setL1SettleTxnsPerSwap(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="sim-output-grid">
          <div className="sim-stat-box">
            <div className="sim-stat-label">Simulated Net Annual Inflation</div>
            <div
              className="sim-stat-val mono"
              style={{
                color:
                  sim.netInflationPct <= 0
                    ? '#047857'
                    : sim.netInflationPct < 1.5
                      ? '#d97706'
                      : '#dc2626',
              }}
            >
              {fmtPct(sim.netInflationPct, 2)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Gross cap: {fmtPct(maxInflationPct, 2)} ({fmtNear(sim.dailyGrossIssuanceNear, 0)}/d)
            </div>
          </div>

          <div className="sim-stat-box">
            <div className="sim-stat-label">Gross Issuance Offset %</div>
            <div className="sim-stat-val mono">{fmtPct(sim.issuanceOffsetPct, 1)}</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              L1 gas + routed buyback: {fmtNear(sim.dailyTotalNearOffset, 0)}/d
            </div>
          </div>

          <div className="sim-stat-box">
            <div className="sim-stat-label">Daily Intents Fee Pool &amp; $NEAR Capture</div>
            <div className="sim-stat-val mono">{fmtUsd(sim.dailyRoutedToNearUsd)}/d</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Out of {fmtUsd(sim.dailyIntentsFeePoolUsd)}/d total Intents pool
            </div>
          </div>

          <div className="sim-stat-box">
            <div className="sim-stat-label">Break-Even Volume for 0% Net Inflation</div>
            <div className="sim-stat-val mono">
              {Number.isFinite(sim.breakEvenDailyVolumeAtConfiguredFeeUsd)
                ? `${fmtUsd(sim.breakEvenDailyVolumeAtConfiguredFeeUsd)}/d`
                : 'Unreachable (Gas Alone)'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Holder burn yield on MCap: {fmtPct(sim.annualizedAccrualYieldOnMcapPct, 2)}/yr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
