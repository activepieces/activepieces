import { createAction, Property } from '@activepieces/pieces-framework';
import { flipsideCryptoAuth } from '../../index';
import { callFlipsideApi, QueryRunResult } from '../common/flipside-api';

export const runQuery = createAction({
  name: 'run_query',
  displayName: 'Run SQL Query',
  description: 'Execute a SQL query against Flipside\'s blockchain data warehouse and return results.',
  auth: flipsideCryptoAuth,
  props: {
    sql: Property.LongText({
      displayName: 'SQL Query',
      description: 'The SQL query to execute. Use Flipside\'s blockchain tables (e.g., ethereum.core.fact_transactions).',
      required: true,
    }),
    ttlMinutes: Property.Number({
      displayName: 'TTL (minutes)',
      description: 'How long to cache the query results (default: 60 minutes).',
      required: false,
      defaultValue: 60,
    }),
    maxAgeMinutes: Property.Number({
      displayName: 'Max Age (minutes)',
      description: 'Maximum age of cached results to return (default: 360 minutes). Set to 0 to always run fresh.',
      required: false,
      defaultValue: 360,
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for paginated results (default: 1).',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of rows per page (default: 100, max: 100000).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { sql, ttlMinutes, maxAgeMinutes, pageNumber, pageSize } = context.propsValue;
    const apiKey = context.auth;

    // Step 1: Create the query run
    const createResult = await callFlipsideApi<QueryRunResult>(apiKey, 'createQueryRun', [
      {
        sql,
        ttlMinutes: ttlMinutes ?? 60,
        maxAgeMinutes: maxAgeMinutes ?? 360,
      },
    ]);

    const queryRunId = createResult.queryRun.id;

    // Step 2: Poll until complete (with timeout)
    const maxWaitMs = 120_000; // 2 minutes
    const pollIntervalMs = 2_000;
    const startTime = Date.now();

    let finalState = createResult.queryRun.state;

    while (
      !['QUERY_STATE_SUCCESS', 'QUERY_STATE_FAILED', 'QUERY_STATE_CANCELED'].includes(finalState)
    ) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(
          `Query timed out after 2 minutes. Query Run ID: ${queryRunId}. Use "Get Query Results" action with this ID to fetch results later.`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const statusResult = await callFlipsideApi<QueryRunResult>(apiKey, 'getQueryRun', [
        { queryRunId },
      ]);
      finalState = statusResult.queryRun.state;
    }

    if (finalState === 'QUERY_STATE_FAILED') {
      throw new Error(`Query failed. Query Run ID: ${queryRunId}`);
    }

    if (finalState === 'QUERY_STATE_CANCELED') {
      throw new Error(`Query was canceled. Query Run ID: ${queryRunId}`);
    }

    // Step 3: Get results
    const results = await callFlipsideApi(apiKey, 'getQueryRunResults', [
      {
        queryRunId,
        format: 'json',
        page: {
          number: pageNumber ?? 1,
          size: pageSize ?? 100,
        },
      },
    ]);

    return {
      queryRunId,
      ...results,
    };
  },
});
