# NEAR Protocol P&L: L1 Burn vs. Intents Value Capture

**Data As Of:** `2026-11-12` (`703` matched daily pairs, `2024-12-10` through `2026-11-12`)  
**Reproduce Entire Dataset & Report Locally:** Run `npm run rebuild && npm test && npm run build` (requires Node >= 20, zero API keys).

---

## 1. Central Thesis Claim

**NEAR has proven product-market fit as a cross-chain execution rail, not yet as a value-capturing base token.**

Over the trailing 30 days ending `2026-11-12`, **NEAR Intents** settled **$3.774B** in swap volume ($37.61B cumulative) and generated **$6.048M** in blended protocol fees (~**16.0 bps**; **$60.75M** all-time). Over the exact same 30-day window, total NEAR L1 transaction fees burnt **$131,476** (~$4,383/day, or **1,051 NEAR/day**), a **46.0x** fee inversion between the application rail and the settlement chain (**76.0x** on trailing 24h: $257,492 vs $3,389).

Even after the October 2025 governance halving cut annualized NEAR supply growth from **4.91%/yr** to **2.48%/yr** (verified on-chain via `EXPERIMENTAL_protocol_config.max_inflation_rate = [1, 40]` = `2.50%`), baseline L1 gas burn still offsets only **1.17%** of the **89,832 NEAR/day** gross staking issuance (~$322,083/day at $3.585). Until governance turns on a direct protocol fee switch routing Intents fee flow into `$NEAR` buyback-and-burn or treasury lockups, equity-like upside for `$NEAR` remains gated by **capital efficiency expectations** rather than live cashflow.

---

## 2. Evidence For the Bull / Adoption Case

1. **Structural Supply Tightening Delivered (`4.91% -> 2.48%`):**
   - Historical supply delta across `api.nearblocks.io/v1/charts` (`2,306` daily rows) verifies a clean regime step-down across the `2025-10-30` halving cutover. Trailing 365d supply rose **+2.48%** vs **+4.91%** in the prior 365d window.
2. **Simpson’s Paradox Exposes the "Intents Bypasses L1" Myth:**
   - A naive all-time regression across the full `703d` matched history shows `r(Intents Vol, L1 Txns) = -0.668` and `r(Intents Vol, L1 Gas Burn) = -0.629`.
   - Slicing by regime proves this is a statistical artifact caused by high-frequency consumer apps (e.g., Sweat / Kai-Ching) tapering from 8.97M daily txns down to ~891K txns during the same calendar year Intents scaled from ~$0 to $125M+/day.
   - Within the recent `90d` cohort (`2026-08-15` to `2026-11-12`), correlation between Intents daily volume and L1 transaction count is reliably positive (`r = +0.407`, Spearman `rho` positive in-window) and `180d` fee-to-volume (`r = +0.348`) and price-to-volume (`r = +0.488`) both move positively.
3. **Best-in-Class Settlement Velocity Among Peer L1s:**
   - DefiLlama multi-chain snapshots (`2026-11-12`) show NEAR carrying just **$164.8M** in TVL and **$132.0M** in stablecoin float — less than 4% of Solana ($5.00B TVL) or Base ($5.50B TVL) — yet sustaining **$184.9M** in 24h DEX volume (**112.2% daily TVL turnover**, roughly **3.7x** Solana's 30.1% and **5.6x** Base's 20.1%).
4. **Non-Tax State-Rent Lockups & Healthy Validator Decentralization:**
   - Live RPC `view_account` inspection shows `intents.near` occupies **13.66 GB** (`13,664,458,570` bytes), locking over **136,645 NEAR** out of liquid circulation under NEAR's `1 NEAR / 100 KB` (`storage_amount_per_byte = 1e19 yocto`) rule. Total lockups across 8 audited core contracts exceed **143,785 NEAR**.
   - Consensus security holds across **356 active validators** staking **589.57M NEAR**, with `Nakamoto33 = 10`, `Nakamoto50 = 17`, and Top-5 stake concentration at **21.45%**.
5. **Verifiable Confidential AI Distribution:**
   - Public catalog telemetry (`cloud-api.near.ai/v1/models`) lists **64 models**, including **16 Private TEE / Attested 3P models** (`nearai`: 12, `attested 3p`: 4) alongside **48 anonymised proxy frontier endpoints**.

---

## 3. Evidence Against / Structural Drag on `$NEAR`

1. **Zero Automated Fee Accrual on Both L1 & 1Click Quoting:**
   - Mainnet RPC `EXPERIMENTAL_protocol_config` reports `protocol_reward_rate = [0, 1]` (**0%** protocol treasury allocation).
   - Live unauthenticated `dry: true` quote probing against `https://1click.chaindefuser.com/v0/quote` ($10,000 exact-input across 7 routes) returns active `201` quotes attaching explicit `appFees` (`1 bps` for USDC/USDC pairs; `20 bps` for BTC/SOL/SUI/wNEAR -> Base USDC) routed directly to implicit account `5880ad2b362620fadf759cbceb1cd5737ce8c6ed7fb8e9942881e6731f9247dd` — not `treasury.near`, and not burned on-chain.
2. **Gas Subsidization Limits Organic Burn Scaling:**
   - Average fee per L1 transaction in the recent 30d cohort (~$4,383 / ~664K txns) equals **~$0.0066/tx**. Increasing L1 transaction throughput 10x from pure settlement receipts alone still leaves annual gross inflation above ~2.20%.
3. **Wider Native `$NEAR` Cross-Chain Execution Spreads:**
   - Live $10,000 exact-input quotes into Base USDC exhibit **1.51–2.01 bps** spread on EVM stable pairs (28–47s ETA) and **20.84–30.39 bps** on SOL/BTC/SUI origins, whereas **wNEAR -> Base USDC** clears at **72.33 bps** (`$9,927.67` out on `$10,000.00` in) — indicating shallower native solver inventory liquidity on NEAR's own token relative to SOL/BTC/USDC corridors.

---

## 4. Explicit Non-Computable Data & Scope Disclosures

1. **Contract-Level Historical Receipt Gas Split (BigQuery):** `bigquery-public-data.crypto_near_mainnet_us` requires GCP project billing credentials, omitted here to keep `npm run rebuild` 100% keyless. Ready-to-run `block_date`-partitioned SQL queries are included in `queries/bigquery/*.sql`.
2. **Solver Net Profit & Individual Route Attribution (`explorer.near-intents.org`):** `/api/v0/transactions` enforces authenticated partner Bearer tokens (`INTENTS_EXPLORER_JWT`, HTTP 401 keyless). Observable protocol fee series rely on DefiLlama `near-intents` aggregates and live `1Click` quote responses.
3. **Off-Chain Hedging Costs:** Market-maker hedging basis and inventory carry across CEXs/other L1s cannot be inferred from on-chain settlements alone.

---

## 5. Falsification & Thesis Flip Conditions

| Hypothesis Test | Live Metric (`2026-11-12`) | Threshold That Changes Conviction |
|---|---|---|
| **Pure Gas Burn Turns Meaningful** | `1.17%` offset (`1,051 NEAR/d`) | Sustained `>= 10%` of gross issuance (`>= 8,983 NEAR/d` burn) for 30 days flips view **Bullish on Organic Burn** |
| **Intents Governance Fee Switch** | `0%` programmatic `$NEAR` capture (`protocol_reward_rate = [0, 1]`) | Governance contract routing `>= 25%` of `$6.05M/30d` Intents fee pool to `$NEAR` buyback/burn cuts net inflation below `1.9%` |
| **Post-Migration Coupling Reversal** | `90d r(Vol, L1 Txns) = +0.407` | Sustained `90d r < 0` alongside growing Intents volume proves Intents can bypass L1 settlement receipts completely (**Bearish Confirm**) |
| **Liquidity Depth Normalization** | `wNEAR -> Base USDC` `$10k` spread = `72.33 bps` | Compression below `25 bps` matches SOL/BTC parity and reduces `$NEAR` exit friction |
