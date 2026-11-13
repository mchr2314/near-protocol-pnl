-- Query 03: Top State-Locking Contracts & Storage-Staked NEAR Demand Over Time
-- Dataset: bigquery-public-data.crypto_near_mainnet_us
-- Note: Measures contract call activity to core state-rent accounts audited live via RPC view_account.

DECLARE lookback_start DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

SELECT
  r.receiver_account_id AS contract_account,
  COUNT(*) AS receipts_90d,
  COUNT(DISTINCT r.originated_from_transaction_hash) AS originating_txns_90d,
  SUM(SAFE_CAST(eo.tokens_burnt AS NUMERIC)) / 1e24 AS tokens_burnt_near_90d,
  AVG(SAFE_CAST(eo.gas_burnt AS NUMERIC)) / 1e12 AS avg_tgas_per_receipt
FROM `bigquery-public-data.crypto_near_mainnet_us.receipts` AS r
JOIN `bigquery-public-data.crypto_near_mainnet_us.execution_outcomes` AS eo
  ON r.receipt_id = eo.receipt_id
 AND r.block_date = eo.block_date
WHERE r.block_date >= lookback_start
  AND eo.block_date >= lookback_start
  AND r.receiver_account_id IN (
    'intents.near',
    'social.near',
    'wrap.near',
    'v2.ref-finance.near',
    'linear-protocol.near',
    'meta-pool.near',
    'v1.signer',
    'priceoracle.near'
  )
GROUP BY r.receiver_account_id
ORDER BY tokens_burnt_near_90d DESC;
