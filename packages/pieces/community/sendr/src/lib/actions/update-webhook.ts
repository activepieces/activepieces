import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { webhookDropdown, sendrApiCall, flattenObject } from '../common';

export const updateWebhook = createAction({
  auth: sendrAuth,
  name: 'update_webhook',
  displayName: 'Update Webhook',
  description: 'Updates an existing Sendr webhook by its URL.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing webhook, identified by its URL, replacing the supplied fields (name, subscribed events, attributes, or resource filters). Use List Webhooks to find the URL. Idempotent: repeating the same update keyed on that URL yields the same final state.', idempotent: true },
  props: {
    webhook: webhookDropdown,
    name: Property.ShortText({
      displayName: 'Webhook Name',
      description: 'New name for the webhook.',
      required: false,
    }),
    events: Property.Array({
      displayName: 'Events',
      description: 'Updated list of event names to subscribe to.',
      required: false,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'Updated metadata attributes.',
      required: false,
    }),
    resourceType: Property.ShortText({
      displayName: 'Resource Type',
      description: 'Updated resource type filter.',
      required: false,
    }),
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description: 'Updated resource ID filter.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.name) {
      body['name'] = context.propsValue.name;
    }
    if (context.propsValue.events) {
      body['events'] = context.propsValue.events;
    }
    if (context.propsValue.attributes) {
      body['attributes'] = context.propsValue.attributes;
    }
    if (context.propsValue.resourceType) {
      body['resourceType'] = context.propsValue.resourceType;
    }
    if (context.propsValue.resourceId) {
      body['resourceId'] = context.propsValue.resourceId;
    }
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: '/webhook',
      body: { ...body, url: context.propsValue.webhook },
    });
    return flattenObject(response.body);
  },
});
