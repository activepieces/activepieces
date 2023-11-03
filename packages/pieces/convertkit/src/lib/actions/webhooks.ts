import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  targetUrl,
  event,
  eventParameter,
  webhookId,
} from '../common/webhooks';
import { CONVERTKIT_API_URL } from '../common/constants';

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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;

    const eventProp = {
      event: {
        name: context.propsValue.event,
        event_parameter: eventParameter,
      },
      target_url: targetUrl,
    };

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...eventProp, api_secret: context.auth }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error creating webhook' };
    }

    // Get response body
    const data = await response.json();

    // If rule exists, return rule
    if (data.rule) {
      return data.rule;
    }

    // Return response body
    return data;
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${webhookId}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({ api_secret: context.auth }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error deleting webhook' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
