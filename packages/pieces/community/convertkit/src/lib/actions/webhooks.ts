import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  targetUrl,
  event,
  eventParameter,
  webhookId,
} from '../common/webhooks';
import {
  createWebhook as createWebhookAction,
  removeWebhook as removeWebhookAction,
} from '../common/service';

export const createWebhook = createAction({
  auth: convertkitAuth,
  name: 'create_webhook',
  displayName: 'Add Webhook',
  description: 'Create a webhook automation',
  props: {
    targetUrl,
    event,
    eventParameter,
  },
  run(context) {
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
  displayName: 'Delete Webhook',
  description: 'Delete a webhook automation',
  props: {
    webhookId,
  },
  run(context) {
    const { webhookId } = context.propsValue;
    return removeWebhookAction(context.auth, webhookId);
  },
});
