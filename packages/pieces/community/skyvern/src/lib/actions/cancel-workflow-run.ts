import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { skyvernAuth } from '../../index';

export const cancelWorkflowAction = createAction({
  auth: skyvernAuth,
  name: 'cancel_run',
  displayName: 'Cancel Run',
  description: 'Cancel a Skyvern task or workflow run by providing its run ID.',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'ID of the task or workflow run to cancel.',
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;
    const { apiKey } = context.auth as { apiKey: string };

    const result = await makeRequest(
      { apiKey },
      HttpMethod.POST,
      `/runs/${run_id}/cancel`,
      {}
    );

    return result;
  },
});
