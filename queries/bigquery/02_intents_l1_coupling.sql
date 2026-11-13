-- Query 02: NEAR Intents (`intents.near`) & MPC (`v1.signer`) L1 Settlement Share & Coupling
-- Dataset: bigquery-public-data.crypto_near_mainnet_us
-- Note: Filters on `block_date` and isolates Intents settlement receipts from aggregate L1 noise (e.g., Sweat / Kai-Ching).

DECLARE start_date DATE DEFAULT DATE '2024-12-10';

WITH tagged_receipts AS (
  SELECT
    eo.block_date AS utc_date,
    eo.executor_account_id,
    CASE
      WHEN eo.executor_account_id = 'intents.near' THEN 'intents_settlement'
      WHEN eo.executor_account_id = 'v1.signer' THEN 'chain_signatures_mpc'
      WHEN eo.executor_account_id IN ('social.near', 'near') THEN 'identity_and_accounts'
      WHEN eo.executor_account_id IN ('v2.ref-finance.near', 'wrap.near', 'priceoracle.near') THEN 'native_defi_core'
      ELSE 'other_l1_contracts'
    END AS cohort,
    SAFE_CAST(eo.tokens_burnt AS NUMERIC) / 1e24 AS near_burnt
  FROM `bigquery-public-data.crypto_near_mainnet_us.execution_outcomes` AS eo
  WHERE eo.block_date >= start_date
)
SELECT
  utc_date,
  SUM(near_burnt) AS total_l1_near_burnt,
  SUM(IF(cohort = 'intents_settlement', near_burnt, 0)) AS intents_near_burnt,
  SUM(IF(cohort = 'chain_signatures_mpc', near_burnt, 0)) AS mpc_near_burnt,
  SUM(IF(cohort = 'native_defi_core', near_burnt, 0)) AS native_defi_near_burnt,
  SAFE_DIVIDE(
    SUM(IF(cohort = 'intents_settlement', near_burnt, 0)),
    NULLIF(SUM(near_burnt), 0)
  ) * 100 AS intents_share_of_l1_burn_pct,
  COUNTIF(cohort = 'intents_settlement') AS intents_receipt_count,
  COUNT(*) AS total_receipt_count
FROM tagged_receipts
GROUP BY utc_date
ORDER BY utc_date ASC;
