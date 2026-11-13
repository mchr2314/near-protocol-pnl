-- Query 01: NEAR L1 Daily Gas Burn, Burnt NEAR Value, & Halving Regime Cutover
-- Dataset: bigquery-public-data.crypto_near_mainnet_us
-- Note: Always filter on `block_date` to prune daily table partitions cleanly.

DECLARE start_date DATE DEFAULT DATE '2024-12-10';
DECLARE halving_date DATE DEFAULT DATE '2025-10-30';

WITH daily_outcomes AS (
  SELECT
    eo.block_date AS utc_date,
    COUNT(*) AS total_receipt_executions,
    COUNTIF(eo.status = 'SUCCESS_VALUE' OR eo.status = 'SUCCESS_RECEIPT_ID') AS successful_executions,
    SUM(SAFE_CAST(eo.gas_burnt AS NUMERIC)) / 1e12 AS total_tgas_burnt,
    SUM(SAFE_CAST(eo.tokens_burnt AS NUMERIC)) / 1e24 AS l1_tokens_burnt_near
  FROM `bigquery-public-data.crypto_near_mainnet_us.execution_outcomes` AS eo
  WHERE eo.block_date >= start_date
  GROUP BY eo.block_date
),
daily_txns AS (
  SELECT
    tx.block_date AS utc_date,
    COUNT(*) AS l1_txns,
    COUNT(DISTINCT tx.signer_account_id) AS unique_signers
  FROM `bigquery-public-data.crypto_near_mainnet_us.transactions` AS tx
  WHERE tx.block_date >= start_date
  GROUP BY tx.block_date
)
SELECT
  t.utc_date,
  CASE WHEN t.utc_date < halving_date THEN 'pre_halving_5pct' ELSE 'post_halving_2_5pct' END AS monetary_regime,
  t.l1_txns,
  t.unique_signers,
  o.total_tgas_burnt,
  o.l1_tokens_burnt_near
FROM daily_txns AS t
JOIN daily_outcomes AS o USING (utc_date)
ORDER BY t.utc_date ASC;
