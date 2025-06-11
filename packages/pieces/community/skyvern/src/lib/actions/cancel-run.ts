import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common';
import { skyvernAuth } from '../common/auth';

export const cancelRunAction = createAction({
  auth: skyvernAuth,
  name: 'cancel-run',
  displayName: 'Cancel Run',
  description: 'Cancels a workflow or or task run by ID.',
  props: {
    runId: Property.ShortText({
      displayName: 'Workflow/Task Run ID',
      required: true,
    }),
  },
  async run(context) {
    const { runId } = context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/runs/${runId}/cancel`,
      headers: {
        'x-api-key': apiKey,
      },
    });

    return response.body;
  },
});
