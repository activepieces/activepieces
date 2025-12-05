import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAppDropdownOptions } from '../common';

interface WebhookInfo {
  webhookId: string;
  webhookReference: string;
}

export const newAppResult = createTrigger({
  auth: promptmateAuth,
  name: 'new_app_result',
  displayName: 'New App Result',
  description: 'Triggers when there is a new app result from PromptMate',
  props: {
    restrictedAppIds: Property.MultiSelectDropdown({
      displayName: 'Restrict to Apps',
      description: 'Only trigger for results from these specific apps. Leave empty to trigger for all apps.',
      required: false,
      refreshers: [],
      auth: promptmateAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
          };
        }
        const options = await getAppDropdownOptions(auth.secret_text);
        return {
          ...options,
          options: options.options || [],
        };
      },
    }),
    webhookType: Property.StaticDropdown({
      displayName: 'Trigger Level',
      description: 'Choose when to trigger the webhook',
      required: true,
      defaultValue: 'row',
      options: {
        options: [
          {
            label: 'Row Level',
            value: 'row',
          },
          {
            label: 'Job Level',
            value: 'job',
          },
        ],
      },
    }),
    webhookReference: Property.ShortText({
      displayName: 'Webhook Reference',
      description: 'Optional reference for this webhook (used for identification)',
      required: false,
    }),
  },
  sampleData: {
    jobId: 'job_123456',
    jobStatus: 'completed',
    results: [
      {
        input: { field1: 'value1', field2: 'value2' },
        output: { result: 'processed data' },
        status: 'success',
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { restrictedAppIds, webhookType, webhookReference } = context.propsValue;

    const webhookName = `ActivePieces-${webhookReference || `webhook-${Date.now()}`}`;

    const requestBody: any = {
      webhookName,
      webhookType,
      endpointUrl: context.webhookUrl,
    };

    if (webhookReference) {
      requestBody.webhookReference = webhookReference;
    }

    if (restrictedAppIds && restrictedAppIds.length > 0) {
      requestBody.restrictedAppIds = restrictedAppIds;
    }

    const response = await httpClient.sendRequest<WebhookInfo[]>({
      method: HttpMethod.POST,
      url: 'https://api.promptmate.io/v1/webhooks',
      headers: {
        'x-api-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    const webhook = response.body[0];
    if (!webhook) {
      throw new Error('Failed to create webhook');
    }

    await context.store.put<WebhookInfo>('promptmate_webhook', {
      webhookId: webhook.webhookId,
      webhookReference: webhookReference || webhookName,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInfo>('promptmate_webhook');
    if (webhookInfo) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: 'https://api.promptmate.io/v1/webhooks',
        headers: {
          'x-api-key': context.auth.secret_text,
          'Content-Type': 'application/json',
        },
        body: {
          webhookId: webhookInfo.webhookId,
        },
      });
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    return [payload];
  },
});
