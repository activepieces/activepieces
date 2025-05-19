import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const submitWorkflowRun = createAction({
  name: 'submit_workflow_run',
  displayName: 'Submit Workflow Run',
  description: 'Submit a new workflow run for execution',
  props: {
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The ID of the workflow to run',
      required: true,
    }),
    inputs: Property.Object({
      displayName: 'Inputs',
      description: 'The input parameters for the workflow',
      required: true,
    }),
  },
  async run(context) {
    const { workflow_id, inputs } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${COMFYICU_API_URL}/workflows/${workflow_id}/runs`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs,
      },
    });
  },
});
