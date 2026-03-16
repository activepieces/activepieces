import { createAction, Property } from '@activepieces/pieces-framework';
import { flipsideCryptoAuth } from '../../index';
import { callFlipsideApi } from '../common/flipside-api';

export const cancelQuery = createAction({
  name: 'cancel_query',
  displayName: 'Cancel Query',
  description: 'Cancel a currently running query to stop resource usage.',
  auth: flipsideCryptoAuth,
  props: {
    queryRunId: Property.ShortText({
      displayName: 'Query Run ID',
      description: 'The ID of the query run to cancel.',
      required: true,
    }),
  },
  async run(context) {
    const { queryRunId } = context.propsValue;
    const apiKey = context.auth;

    const result = await callFlipsideApi(apiKey, 'cancelQueryRun', [
      { queryRunId },
    ]);

    return {
      success: true,
      queryRunId,
      result,
    };
  },
});
