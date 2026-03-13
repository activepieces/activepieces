import { createAction, Property } from '@activepieces/pieces-framework';
import { leapAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const runAWorkflow = createAction({
  auth: leapAiAuth,
  name: 'runAWorkflow',
  displayName: 'Run a Workflow',
  description: 'Execute a Leap AI workflow and return the run ID',
  props: {
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The ID of the workflow to run',
      required: true,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description:
        'The URL to which workflow results should be sent on completion (optional)',
      required: false,
    }),
    input: Property.Object({
      displayName: 'Input Variables',
      description:
        'Variables that the workflow can use globally and their values (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { workflow_id, webhook_url, input } = context.propsValue;

    const body: any = {
      workflow_id,
    };

    if (webhook_url) {
      body.webhook_url = webhook_url;
    }

    if (input) {
      body.input = input;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/runs',
      body
    );

    return response;
  },
});
