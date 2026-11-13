# NEAR Hackathon Submission Pack (`thesis` Track)

> **Human-Only Actions Checklist**
> Per hackathon rules & workstation safeguards, external publishing is left for your explicit action:
> 1. Push local repo (`git init` already ready) to a **public GitHub repository** (`https://github.com/<your-user>/near-protocol-pnl`).
> 2. Optional: deploy static `dist/` folder cleanly to Cloudflare Pages / Vercel / GitHub Pages for a live `demo_url`.
> 3. Post demo thread/video on X tagging `@nearprotocol` or referencing the submission, then copy the post URL.
> 4. Connect / enter your `.near` payout account (`account_id`) on `https://nearhackathon.com` and submit before `2026-11-14T23:59:00Z` (`2026-11-15 06:59 WIB`).

---

## Application Fields (`https://nearhackathon.com`)

- **Track:** `thesis`
- **Project Name:** `NEAR Protocol P&L — L1 Burn vs. Intents Capture`
- **One-Line Summary:**
  `Evidence-first empirical thesis & P&L simulator proving NEAR Intents drives $6.05M/30d fees (46x L1 burn) while exposing Simpson's Paradox in pooled vs. 90d settlement coupling.`
- **Repo URL (`github.com`):** `https://github.com/mchr2314/near-protocol-pnl` *(replace/confirm after pushing)*
- **What Makes It Strong for `Claude Code + Codex` AI Screening & Human Jury:**
  1. Single-command keyless live data rebuild (`npm run rebuild`) across 5 public sources (`NEARBlocks`, `Mainnet RPC`, `DefiLlama`, `1Click`, `NEAR.AI`) with full `data/raw/` snapshots.
  2. Verified on-chain forensic finding: live `1Click` quotes attach explicit `appFees` routed to implicit account `5880ad2b...9247dd` while `EXPERIMENTAL_protocol_config.protocol_reward_rate = [0, 1]` (0% programmatic burn/treasury capture).
  3. Algebraic + live dataset proof of **Simpson's Paradox** (`r_all = -0.668` across 703d vs `r_90d = +0.407` post-migration).
  4. Partition-filtered (`block_date`) BigQuery SQL in `queries/bigquery/*.sql` + 14 passing Vitest unit & dataset integrity assertions (`npm test`) + MIT `LICENSE`.

---

## Ready-to-Paste X Demo Post Draft (<= 280 chars option + Thread option)

### Concise Single Post (Recommended for Demo Submission)
```text
Built "NEAR Protocol P&L — L1 Burn vs. Intents Capture" for the @near_ai / @NEARProtocol Hackathon (Thesis track).

Key finding from 703 live days:
• Intents = $6.05M/30d fees vs L1 gas = $131K/30d (46x gap)
• Naive 703d r = -0.668 is Simpson's Paradox; 90d r = +0.407
• 1-command keyless rebuild + P&L simulator

Repo & Thesis: <YOUR_PUBLIC_GITHUB_URL>
```

### Technical Follow-Up Reply (Optional Thread Tweet 2)
```text
Live on-chain forensics baked into the repo (`npm run rebuild && npm test`):
- RPC confirms Oct 2025 halving (4.91% -> 2.48%/yr) & 0% treasury fee switch
- L1 gas burn (~1,051 NEAR/d) offsets just 1.17% of issuance
- intents.near locks 136,645+ NEAR in state rent
- Includes BigQuery block_date SQL + bull/bear falsifiers
```
