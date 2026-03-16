import { createAction, Property } from '@activepieces/pieces-framework';
import { flipsideCryptoAuth } from '../../index';
import { callFlipsideApi, QueryRunResult } from '../common/flipside-api';

const TOP_TOKENS_SQL = `
SELECT
  symbol_in AS token_symbol,
  COUNT(*) AS swap_count,
  SUM(amount_in_usd) AS total_volume_usd
FROM ethereum.defi.ez_dex_swaps
WHERE block_timestamp >= DATEADD('hour', -24, CURRENT_TIMESTAMP)
  AND amount_in_usd IS NOT NULL
  AND symbol_in IS NOT NULL
GROUP BY 1
ORDER BY total_volume_usd DESC
LIMIT 20
`.trim();

export const getTopTokensByVolume = createAction({
  name: 'get_top_tokens_by_volume',
  displayName: 'Get Top Tokens by 24h DEX Volume',
  description: 'Fetch the top 20 tokens by 24-hour DEX trading volume on Ethereum using a pre-built query.',
  auth: flipsideCryptoAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of top tokens to return (default: 20, max: 100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;
    const apiKey = context.auth;

    const actualLimit = Math.min(limit ?? 20, 100);
    const sql = TOP_TOKENS_SQL.replace('LIMIT 20', `LIMIT ${actualLimit}`);

    // Create query run
    const createResult = await callFlipsideApi<QueryRunResult>(apiKey, 'createQueryRun', [
      {
        sql,
        ttlMinutes: 60,
        maxAgeMinutes: 60, // refresh every hour since this is live data
      },
    ]);

    const queryRunId = createResult.queryRun.id;

    // Poll until complete
    const maxWaitMs = 120_000;
    const pollIntervalMs = 2_000;
    const startTime = Date.now();
    let finalState = createResult.queryRun.state;

    while (
      !['QUERY_STATE_SUCCESS', 'QUERY_STATE_FAILED', 'QUERY_STATE_CANCELED'].includes(finalState)
    ) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(
          `Query timed out. Use "Get Query Results" with Query Run ID: ${queryRunId}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const statusResult = await callFlipsideApi<QueryRunResult>(apiKey, 'getQueryRun', [
        { queryRunId },
      ]);
      finalState = statusResult.queryRun.state;
    }

    if (finalState !== 'QUERY_STATE_SUCCESS') {
      throw new Error(`Query ended with state: ${finalState}. Query Run ID: ${queryRunId}`);
    }

    const results = await callFlipsideApi<{
      rows: [string, number, number][];
      columnNames: string[];
      page: { totalRows: number };
    }>(apiKey, 'getQueryRunResults', [
      {
        queryRunId,
        format: 'json',
        page: { number: 1, size: actualLimit },
      },
    ]);

    // Format results nicely
    const tokens = (results.rows ?? []).map((row) => ({
      token_symbol: row[0],
      swap_count: row[1],
      total_volume_usd: row[2],
    }));

    return {
      queryRunId,
      tokens,
      totalRows: results.page?.totalRows ?? tokens.length,
      generatedAt: new Date().toISOString(),
    };
  },
});
