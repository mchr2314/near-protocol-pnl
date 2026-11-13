import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { AccrualSimulator } from './components/AccrualSimulator.js';
import { ChartCard } from './components/ChartCard.js';
import { PeerMatrix } from './components/PeerMatrix.js';
import { SolverProbeTable } from './components/SolverProbeTable.js';
import {
  FeeInversionChart,
  HalvingInflationChart,
  SimpsonsParadoxChart,
} from './components/SvgCharts.js';
import { ThesisReader } from './components/ThesisReader.js';
import type { ThesisReport, WindowKey } from './types.js';
import { fmtNear, fmtPct, fmtUsd } from './utils/format.js';

type TabKey = 'observatory' | 'simulator' | 'forensics' | 'thesis';

export function App() {
  const [report, setReport] = useState<ThesisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('observatory');
  const [selectedWindow, setSelectedWindow] = useState<WindowKey>('90d');

  useEffect(() => {
    fetch('./data/thesis-report.json')
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status} loading thesis-report.json`);
        return (await resp.json()) as ThesisReport;
      })
      .then((json) => setReport(json))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) {
    return (
      <div className="container" style={{ padding: '48px 20px' }}>
        <div className="card">
          <h2>Failed to Load Derived Dataset</h2>
          <p>{error}</p>
          <p className="mono">Run `npm run rebuild` to regenerate public/data/thesis-report.json.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container" style={{ padding: '48px 20px', color: '#475569' }}>
        Loading empirical thesis telemetry...
      </div>
    );
  }

  const { macroHeadline: h } = report;
  const provMap = new Map(report.provenance.map((p) => [p.chartId, p]));

  return (
    <div>
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            <div className="brand-block">
              <span className="brand-kicker">
                <Activity size={13} />
                NEAR Protocol Investment Thesis &amp; P&amp;L Workbench
              </span>
              <h1 className="brand-title">L1 Burn vs. NEAR Intents Capture</h1>
            </div>

            <div className="meta-pills">
              <span className="pill pill-green mono">Data As Of: {report.dataAsOfDate}</span>
              <span className="pill mono">
                RPC Block #{(report.consensus.blockHeight ?? report.consensus.epochStartHeight).toLocaleString('en-US')}
              </span>
              <span className="pill mono">703 Paired Days</span>
            </div>
          </div>

          <nav className="nav-bar" aria-label="Primary workbench views">
            <button
              type="button"
              className={`nav-btn ${tab === 'observatory' ? 'active' : ''}`}
              onClick={() => setTab('observatory')}
            >
              <BarChart3 size={15} />
              Empirical Observatory
            </button>
            <button
              type="button"
              className={`nav-btn ${tab === 'simulator' ? 'active' : ''}`}
              onClick={() => setTab('simulator')}
            >
              <Calculator size={15} />
              P&amp;L &amp; Fee-Switch Simulator
            </button>
            <button
              type="button"
              className={`nav-btn ${tab === 'forensics' ? 'active' : ''}`}
              onClick={() => setTab('forensics')}
            >
              <CheckCircle2 size={15} />
              1Click Quotes, Storage &amp; TEEs
            </button>
            <button
              type="button"
              className={`nav-btn ${tab === 'thesis' ? 'active' : ''}`}
              onClick={() => setTab('thesis')}
            >
              <BookOpen size={15} />
              Thesis Memo &amp; SQL
            </button>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <div className="thesis-banner">
          <div className="banner-eyebrow">Empirical Thesis Statement</div>
          <p className="banner-claim">
            NEAR Intents proved cross-chain execution PMF ({fmtUsd(h.intentsVolAllTimeUsd)} cumulative
            volume, {fmtUsd(h.intentsFee30dUsd)}/30d fees), yet NEAR L1 captures only ~
            {fmtPct(h.netInflationOffsetPct, 2)} of its 2.50% issuance ceiling via gas burn until a
            governance fee switch routes solver revenue into $NEAR.
          </p>
          <p className="banner-sub">
            Rebuilt deterministically via <code className="mono">npm run rebuild</code> from
            unauthenticated NEAR Mainnet RPC, NEARBlocks, DefiLlama, 1Click, and NEAR.AI endpoints.
            All naive all-time vs. recent 90d correlations are decomposed to expose Simpson&apos;s
            Paradox.
          </p>
        </div>

        {/* 4 Core KPI Strip */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">
              <span>$NEAR Market Cap / Spot</span>
              <span className="badge mono">RPC Cap {fmtPct(report.consensus.maxInflationPct, 2)}</span>
            </div>
            <div className="kpi-value mono">{fmtUsd(h.marketCapUsd)}</div>
            <div className="kpi-foot mono">
              ${h.nearPriceUsd.toFixed(3)} · Supply {(h.totalSupplyNear / 1e9).toFixed(3)}B NEAR
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>30d Intents vs. L1 Fee Ratio</span>
              <span className="badge badge-amber">Fee Inversion</span>
            </div>
            <div className="kpi-value mono">{h.intentsToL1FeeRatio30d.toFixed(1)}x</div>
            <div className="kpi-foot mono">
              {fmtUsd(h.intentsFee30dUsd)} Intents vs {fmtUsd(h.l1Fee30dUsd)} L1 ({h.intentsBlendedBps30d.toFixed(1)} bps)
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>Issuance vs. L1 Gas Offset</span>
              <span className="badge badge-red">
                <ShieldAlert size={11} />
                0% Fee Switch
              </span>
            </div>
            <div className="kpi-value mono">{fmtPct(h.netInflationOffsetPct, 2)}</div>
            <div className="kpi-foot mono">
              {fmtNear(h.dailyL1GasBurnNear, 0)}/d burnt vs {fmtNear(h.dailyGrossIssuanceNear, 0)}/d issued
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>365d Supply Expansion (Halving)</span>
              <span className="badge badge-green">Cut in Half</span>
            </div>
            <div className="kpi-value mono">{fmtPct(h.annualizedInflation365dPct, 2)}</div>
            <div className="kpi-foot mono">
              Down from {fmtPct(h.prior365dInflationPct, 2)} prior 365d · Cutover {report.halvingCutoverDate}
            </div>
          </div>
        </div>

        {tab === 'observatory' && (
          <>
            <ChartCard
              title="1. Monetary Regime: October 2025 Inflation Halving & Supply Curve"
              plainSentence={
                provMap.get('supply-halving')?.plainSentence ??
                'Annualized issuance stepped down from ~5.0% to ~2.5% after October 2025 governance activation.'
              }
              badgeText={`Current 365d: ${fmtPct(h.annualizedInflation365dPct, 2)}`}
              badgeVariant="green"
              provenance={provMap.get('supply-halving')}
            >
              <HalvingInflationChart
                series={report.pairedSeries}
                halvingCutoverDate={report.halvingCutoverDate}
              />
            </ChartCard>

            <ChartCard
              title="2. Simpson’s Paradox Audit: Intents Volume vs. NEAR L1 Activity"
              plainSentence={
                provMap.get('simpsons-paradox')?.plainSentence ??
                'All-time pooled history displays negative correlation driven by legacy app churn, whereas recent 90d confirms positive L1 txn coupling.'
              }
              badgeText={`All: ${(report.correlationWindows.find((w) => w.windowKey === 'all')?.rNiVolVsL1Txns ?? 0).toFixed(3)} vs 90d: ${(report.correlationWindows.find((w) => w.windowKey === '90d')?.rNiVolVsL1Txns ?? 0) >= 0 ? '+' : ''}${(report.correlationWindows.find((w) => w.windowKey === '90d')?.rNiVolVsL1Txns ?? 0).toFixed(3)}`}
              badgeVariant="blue"
              provenance={provMap.get('simpsons-paradox')}
            >
              <SimpsonsParadoxChart
                windows={report.correlationWindows}
                series={report.pairedSeries}
                selectedWindow={selectedWindow}
                onSelectWindow={setSelectedWindow}
              />
            </ChartCard>

            <ChartCard
              title="3. The 46x Fee Inversion: NEAR Intents Swap Pool vs. L1 Base Fees"
              plainSentence={
                provMap.get('value-inversion')?.plainSentence ??
                'Cumulative and monthly Intents swap fees dwarf NEAR L1 gas revenue without automated protocol buybacks.'
              }
              badgeText={`24h Multiple: ${h.intentsToL1FeeRatio24h.toFixed(1)}x`}
              badgeVariant="amber"
              provenance={provMap.get('value-inversion')}
            >
              <FeeInversionChart series={report.pairedSeries} />
            </ChartCard>

            <ChartCard
              title="4. Peer L1 Valuation, Stablecoin Float & Liquidity Turnover"
              plainSentence={
                provMap.get('peer-efficiency')?.plainSentence ??
                'NEAR ranks low on idle TVL but leads L1/L2 peers in daily DEX turnover velocity.'
              }
              badgeText={`24h Vol/TVL: ${fmtPct(report.peerChains.find((c) => c.chain === 'Near')?.tvlTurnover24hPct ?? 0, 1)}`}
              badgeVariant="green"
              provenance={provMap.get('peer-efficiency')}
            >
              <PeerMatrix peers={report.peerChains} protocols={report.ecosystemProtocols} />
            </ChartCard>
          </>
        )}

        {tab === 'simulator' && (
          <ChartCard
            title="Protocol P&L & Monetary Accrual Break-Even Simulator"
            plainSentence="Adjust daily Intents volume, fee capture share, and L1 settlement intensity to calculate the exact threshold where $NEAR turns net-deflationary."
            badgeText={`Live Price: $${h.nearPriceUsd.toFixed(2)}`}
            badgeVariant="blue"
            provenance={provMap.get('value-inversion')}
          >
            <AccrualSimulator
              headline={h}
              maxInflationPct={report.consensus.maxInflationPct}
            />
          </ChartCard>
        )}

        {tab === 'forensics' && (
          <ChartCard
            title="5. Live 1Click Quotes, RPC State Lockups, Validator Nakamoto & NEAR.AI Supply"
            plainSentence={
              provMap.get('storage-and-validators')?.plainSentence ??
              'Live quotes verify fee destinations, while intents.near permanently locks over 136k NEAR in on-chain state.'
            }
            badgeText={`${report.oneClickUniverse.tokenCount} 1Click Assets | ${report.nearAiCatalog.totalModels} AI Models`}
            badgeVariant="green"
            provenance={provMap.get('storage-and-validators')}
          >
            <SolverProbeTable
              tokenCount={report.oneClickUniverse.tokenCount}
              chainCount={report.oneClickUniverse.chainCount}
              probes={report.oneClickUniverse.probes}
              lockups={report.contractStorageLockups}
              totalLockupNear={report.totalLockupNearSampled}
              consensus={report.consensus}
              nearAiCatalog={report.nearAiCatalog}
            />
          </ChartCard>
        )}

        {tab === 'thesis' && (
          <ThesisReader
            headline={h}
            thresholds={report.falsificationThresholds}
            disclosures={report.nonComputableDisclosures}
          />
        )}
      </main>

      <footer className="container footer">
        <span>
          <strong>NEAR Protocol P&amp;L</strong> · MIT License · Rebuilt{' '}
          <span className="mono">{report.generatedAtUtc}</span>
        </span>
        <span>
          Commands: <code className="mono">npm run rebuild</code> ·{' '}
          <code className="mono">npm test</code> · <code className="mono">npm run build</code>
        </span>
      </footer>
    </div>
  );
}
