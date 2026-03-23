import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { mindStudioAuth } from '../..';

export const runWorkflowAction = createAction({
  auth: mindStudioAuth,
  name: 'run_workflow',
  displayName: 'Run Workflow',
  description: 'Run a workflow from your MindStudio app and start a thread.',
  props: {
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'MindStudio app ID to run.',
      required: true,
    }),
    workflow: Property.ShortText({
      displayName: 'Workflow',
      description: 'Workflow name to run (without the .flow extension).',
      required: false,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      description: 'Key-value variables passed to the app.',
      required: false,
      defaultValue: {},
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to receive the execution result asynchronously.',
      required: false,
    }),
    includeBillingCost: Property.Checkbox({
      displayName: 'Include Billing Cost',
      description: 'Return the billing cost in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      appId: propsValue.appId,
    };

    if (propsValue.workflow) {
      body['workflow'] = propsValue.workflow;
    }

    if (propsValue.variables) {
      body['variables'] = propsValue.variables;
    }

    if (propsValue.callbackUrl) {
      body['callbackUrl'] = propsValue.callbackUrl;
    }

    if (propsValue.includeBillingCost !== undefined) {
      body['includeBillingCost'] = propsValue.includeBillingCost;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.mindstudio.ai/developer/v2/apps/run',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
