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
  audience: 'both',
  aiMetadata: {
    description:
      'Registers a webhook automation that POSTs to a target URL whenever the chosen ConvertKit event fires (e.g. subscriber activated, tag added); some events also need an event parameter such as a tag or form ID. Not idempotent — each call registers another webhook, so keep the returned rule ID for later deletion.',
    idempotent: false,
  },
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

    return createWebhookAction(context.auth.secret_text, payload);
  },
});

export const deleteWebhook = createAction({
  auth: convertkitAuth,
  name: 'destroy_webhook',
  displayName: 'Delete Webhook',
  description: 'Delete a webhook automation',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a previously registered webhook automation by its webhook rule ID (returned when the webhook was created). Not retry-safe — a repeat call fails once the webhook is gone.',
    idempotent: false,
  },
  props: {
    webhookId,
  },
  run(context) {
    const { webhookId } = context.propsValue;
    return removeWebhookAction(context.auth.secret_text, webhookId);
  },
});
