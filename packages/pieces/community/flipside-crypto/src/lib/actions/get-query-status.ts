import { createAction, Property } from '@activepieces/pieces-framework';
import { flipsideCryptoAuth } from '../../index';
import { callFlipsideApi, QueryRunResult } from '../common/flipside-api';

export const getQueryStatus = createAction({
  name: 'get_query_status',
  displayName: 'Get Query Status',
  description: 'Check the current status of a running or completed query.',
  auth: flipsideCryptoAuth,
  props: {
    queryRunId: Property.ShortText({
      displayName: 'Query Run ID',
      description: 'The ID of the query run to check status for.',
      required: true,
    }),
  },
  async run(context) {
    const { queryRunId } = context.propsValue;
    const apiKey = context.auth;

    const result = await callFlipsideApi<QueryRunResult>(apiKey, 'getQueryRun', [
      { queryRunId },
    ]);

    return {
      queryRunId: result.queryRun.id,
      state: result.queryRun.state,
      rowCount: result.queryRun.rowCount,
      errorMessage: result.queryRun.errorMessage,
      startedAt: result.queryRun.startedAt,
      endedAt: result.queryRun.endedAt,
      queryRun: result.queryRun,
    };
  },
});
