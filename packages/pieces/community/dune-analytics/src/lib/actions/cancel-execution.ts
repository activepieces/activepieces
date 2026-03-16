import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { duneAnalyticsAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface CancelExecutionResponse {
  success: boolean;
}

export const cancelExecution = createAction({
  name: 'cancel_execution',
  displayName: 'Cancel Execution',
  description:
    'Cancel a running query execution. Use this to stop long-running queries that are no longer needed.',
  auth: duneAnalyticsAuth,
  props: {
    executionId: Property.ShortText({
      displayName: 'Execution ID',
      description:
        'The execution ID of the running query to cancel',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await duneRequest<CancelExecutionResponse>(
      auth as string,
      HttpMethod.POST,
      `/execution/${encodeURIComponent(propsValue.executionId)}/cancel`
    );

    return data;
  },
});
