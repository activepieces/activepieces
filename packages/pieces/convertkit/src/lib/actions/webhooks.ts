import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  createWebhook as createWebhookAction,
  removeWebhook as removeWebhookAction,
  targetUrl,
  event,
  eventParameter,
  webhookId,
} from '../common/webhooks';

export const createWebhook = createAction({
  auth: convertkitAuth,
  name: 'create_webhook',
  displayName: 'Webhook: Add Webhook',
  description: 'Create a webhook automation',
  props: {
    targetUrl,
    event,
    eventParameter,
  },
  async run(context) {
    const { targetUrl, event, eventParameter } = context.propsValue;

    const payload = {
      event: {
        name: event,
        ...eventParameter,
      },
      target_url: targetUrl,
    };

    return createWebhookAction(context.auth, payload);
  },
});

export const deleteWebhook = createAction({
  auth: convertkitAuth,
  name: 'destroy_webhook',
  displayName: 'Webhook: Delete Webhook',
  description: 'Delete a webhook automation',
  props: {
    webhookId,
  },
  async run(context) {
    const { webhookId } = context.propsValue;
    return removeWebhookAction(context.auth, webhookId);
  },
});
