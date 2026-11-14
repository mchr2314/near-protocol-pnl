# NEAR Protocol P&L — L1 Burn vs. Intents Value Capture

> - **NEAR Hackathon 2026 Track:** `["thesis"]`
> - **Live Web Observatory:** `https://mchr2314.github.io/near-protocol-pnl/`
> - **NEAR Mainnet Author / Payout Address:** `7c26d89c3391ae3309816da50ab2cd29799e52accf3c81120d17777ed849b0b1`

Reproducible empirical investment thesis and unit-economics workbench analyzing NEAR Protocol's October 2025 inflation halving, Simpson's Paradox in L1-vs-Intents activity correlation, and cross-chain fee accrual.

## Quickstart (`do X - see Y`)

1. **Install dependencies** - run `npm install` - see `node_modules/` installed cleanly (`Node >= 20` required, zero API keys).
2. **Rebuild all raw & derived empirical datasets live** - run `npm run rebuild` - see `[1/6]` through `[6/6]` complete against NEARBlocks, NEAR Mainnet RPC (`fastnear`), DefiLlama, 1Click, and NEAR.AI endpoints, refreshing `data/raw/*.json`, `data/derived/thesis-report.json`, and `public/data/thesis-report.json`.
3. **Verify statistical invariants, halving parity, and SQL partition filters** - run `npm test` - see `14 passed` across `tests/math.test.ts` (8 pure unit/Simpson/simulator tests) and `tests/dataset.test.ts` (6 live-dataset & BigQuery assertions).
4. **Type-check & build the static web workbench** - run `npm run build` - see `tsc --noEmit` exit `0` and bundled dashboard emitted to `dist/`.
5. **Inspect live in browser** - run `npm run preview` - see the interactive observatory at `http://127.0.0.1:4173` (switching between Empirical Observatory charts, P&L Fee-Switch Simulator, 1Click Live Quotes & RPC State Lockups, and Thesis Memo & BigQuery SQL).
6. **Run full one-command gate** - run `npm run verify` - see `rebuild && test && build` pass sequentially.

## Key Empirical Findings (Live `2026-11-12` Baseline)

- **Monetary Regime (`2.48%` vs `4.91%`):** Annualized supply expansion halved cleanly across the October 2025 cutover, confirmed by live RPC `max_inflation_rate = [1, 40]` (`2.50%`), while L1 gas burn (`1,051 NEAR/d`, `~$4,383/d`) still offsets only **`1.17%`** of daily staking issuance (`89,832 NEAR/d`).
- **46x–76x Fee Inversion:** NEAR Intents captures **`$6.05M / 30d`** (~`16.0 bps` blended) vs **`$131.5K / 30d`** in NEAR L1 base fees (**`46.0x`** 30d; **`76.0x`** 24h), while `1Click` live dry quotes confirm `appFees` route to implicit hex account `5880ad2b...9247dd` with **`0%`** consensus treasury routing (`protocol_reward_rate = [0, 1]`).
- **Simpson’s Paradox Exposed:** Pooled `703d` correlation (`r = -0.668`) misleadingly implies decoupling because Sweat-era consumer tx decay overlapped Intents scaling; within the post-migration `90d` cohort, correlation between Intents daily volume and L1 transactions flips positive (**`r = +0.407`**).
- **State Lockups & Liquidity Efficiency:** `intents.near` permanently state-stakes **`136,645 NEAR`** (`13.66 GB`) and NEAR leads peers with **`112.2%`** 24h DEX volume / TVL turnover despite modest idle TVL (`$164.8M`).

## Repository Map

- `src/etl/config.ts`, `src/etl/fetchers.ts`, `src/etl/math.ts`, `src/etl/rebuild.ts` — Keyless public data pipeline, statistical & monetary P&L engine.
- `queries/bigquery/01_l1_burn_and_issuance.sql` .. `03_contract_storage_lockups.sql` — Partition-filtered (`block_date`) Standard SQL queries for `bigquery-public-data.crypto_near_mainnet_us`.
- `src/ui/` — Static zero-runtime-backend React/Vite observatory, interactive P&L simulator, live 1Click quote inspector, and provenance drawers.
- `THESIS.md` — Full institutional thesis claim, bull/bear evidence, non-computable data gaps, and live falsification triggers.
- `tests/` — Vitest unit and dataset integrity verification suite.

## License

MIT — see `LICENSE`.

## Independent Second Submission Disclosure (`Q-015`)

Per `HACKATHON.md` FAQ `Q-015` (*"Allowed if projects are independent and disclosed: each README names the other project"*), this author also created the independent multi-track AI Agent system **[near-clawswarm-nexus](https://github.com/mchr2314/near-clawswarm-nexus)** (*VeriPact — NEP-413 Verifiable Contractor Agent, 20×5 Commit-Reveal Clearinghouse & Scoped-Key Guard on NEAR* for tracks `["agents", "swarms", "security", "business"]`, live at `https://mchr2314.github.io/near-clawswarm-nexus/`). Both projects have zero shared code and address completely independent tracks.

MIT — see [`LICENSE`](./LICENSE).
