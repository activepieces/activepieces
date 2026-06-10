import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall, flattenObject } from '../common';

export const createWebhook = createAction({
  auth: sendrAuth,
  name: 'create_webhook',
  displayName: 'Create Webhook',
  description: 'Registers a new webhook in Sendr to receive event notifications.',
  props: {
    name: Property.ShortText({
      displayName: 'Webhook Name',
      description: 'A human-readable name for the webhook.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'The endpoint URL that Sendr will call when events occur.',
      required: true,
    }),
    events: Property.Array({
      displayName: 'Events',
      description: 'List of event names to subscribe to (e.g. page_render:created, contact_page_engagement:created).',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'Optional metadata attributes for the webhook.',
      required: false,
    }),
    resourceType: Property.ShortText({
      displayName: 'Resource Type',
      description: 'Optional resource type filter for the webhook.',
      required: false,
    }),
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description: 'Optional resource ID filter for the webhook.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      url: context.propsValue.url,
      events: context.propsValue.events,
    };
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
      method: HttpMethod.POST,
      path: '/webhook',
      body,
    });
    return flattenObject(response.body);
  },
});
