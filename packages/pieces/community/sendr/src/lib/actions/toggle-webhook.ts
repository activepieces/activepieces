import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { webhookDropdown, sendrApiCall, flattenObject } from '../common';

export const toggleWebhook = createAction({
  auth: sendrAuth,
  name: 'toggle_webhook',
  displayName: 'Toggle Webhook',
  description: 'Enables or disables a registered Sendr webhook.',
  props: {
    webhook: webhookDropdown,
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Check to enable the webhook, uncheck to disable it.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhook/enabling',
      body: {
        url: context.propsValue.webhook,
        enabled: context.propsValue.enabled,
      },
    });
    return flattenObject(response.body);
  },
});
