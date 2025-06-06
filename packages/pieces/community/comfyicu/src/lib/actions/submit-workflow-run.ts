import { comfyIcuAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { comfyIcuApiCall, commonProps } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const submitWorkflowRunAction = createAction({
  auth: comfyIcuAuth,
  name: 'submit-workflow-run',
  displayName: 'Submit Workflow Run',
  description: 'Execute a workflow with specified prompt.',
  props: {
    workflow_id:commonProps.workflow_id,
    prompt:Property.Json({
        displayName:'Prompt',
        description:'You can get workflow prompt by navigating to History->Select Run -> Copy API Workflow.',
        required:true
    }),
    webhook:Property.ShortText({
        displayName:'Webhook',
        required:false,
        description:'Webhook URL to recieve run status.'
    })
  },
  async run(context) {
    const { workflow_id, prompt,webhook } = context.propsValue;
    const response = await comfyIcuApiCall({
      apiKey: context.auth,
      endpoint: `/workflows/${workflow_id}/runs`,
      method: HttpMethod.POST,
      body:{
        prompt,
        webhook
      }
    });

    return response.body;
  },
});
