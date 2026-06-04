import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { webhookDropdown, sendrApiCall, flattenObject } from '../common';

export const deleteWebhook = createAction({
  auth: sendrAuth,
  name: 'delete_webhook',
  displayName: 'Delete Webhook',
  description: 'Deletes a registered Sendr webhook by its URL.',
  props: {
    webhook: webhookDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: '/webhook',
      body: { url: context.propsValue.webhook },
    });
    return flattenObject(response.body);
  },
});
