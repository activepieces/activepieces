import { createAction, Property } from '@activepieces/pieces-framework';
import { flipsideCryptoAuth } from '../../index';
import { callFlipsideApi } from '../common/flipside-api';

export const getQueryResults = createAction({
  name: 'get_query_results',
  displayName: 'Get Query Results',
  description: 'Retrieve results of a previously executed query by its Query Run ID.',
  auth: flipsideCryptoAuth,
  props: {
    queryRunId: Property.ShortText({
      displayName: 'Query Run ID',
      description: 'The ID of the query run to fetch results for.',
      required: true,
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
    const { queryRunId, pageNumber, pageSize } = context.propsValue;
    const apiKey = context.auth;

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

    return results;
  },
});
