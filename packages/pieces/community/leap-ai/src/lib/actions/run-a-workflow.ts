import { createAction, Property } from '@activepieces/pieces-framework';
import { leapAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const runAWorkflow = createAction({
  auth: leapAiAuth,
  name: 'runAWorkflow',
  displayName: 'Run a Workflow',
  description: 'Execute a Leap AI workflow and return the run ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts execution of a Leap AI workflow identified by its workflow ID, optionally passing input variables and a webhook URL to receive results on completion. Returns a run ID to track progress; pair with "Get a Workflow Run" to poll for status and results. Each call launches a new run, so it is not idempotent.',
    idempotent: false,
  },
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
