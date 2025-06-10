import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const cancelWorkflowRun = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: skyvernAuth,
  name: 'cancelWorkflowRun',
  displayName: 'Cancel Workflow Run',
  description: 'Cancel a task or workflow run by its ID',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The ID of the task run or workflow run to cancel',
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;

    const response = await makeRequest(
      { apiKey: context.auth.apiKey },
      HttpMethod.POST,
      `/runs/${run_id}/cancel`,
      {}
    );

    return response;
  },
});
