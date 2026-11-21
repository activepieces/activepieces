import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_WEBHOOK_EVENT_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const updateWebhook = createAction({
  auth: villageAuth,
  name: 'update_webhook',
  classification: 'WRITE',
  displayName: 'Update Webhook',
  description: 'Change the URL, description, event types or active state of a webhook. Fields left empty are not changed. Free.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates a webhook by ID; omitted fields stay unchanged. Idempotent for the same input.',
    idempotent: true,
  },
  outputSchema: villageSchemas.singleWebhook,
  props: {
    id: Property.ShortText({ displayName: 'Webhook ID', required: true }),
    url: Property.ShortText({ displayName: 'URL', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    event_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Leave empty to keep the current event types.',
      required: false,
      options: { options: VILLAGE_WEBHOOK_EVENT_OPTIONS },
    }),
    receive_all_events: Property.Checkbox({
      displayName: 'Receive All Event Types',
      description: 'Clear the event filter so every event type is delivered. Overrides Event Types.',
      required: false,
      defaultValue: false,
    }),
    is_active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Leave empty to keep the current state.',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'yes' },
          { label: 'Paused', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const { id, url, description, event_filter, receive_all_events, is_active } = context.propsValue;
    const body: Record<string, unknown> = {};
    if (url) {
      body['url'] = url;
    }
    if (description) {
      body['description'] = description;
    }
    if (receive_all_events) {
      body['event_filter'] = null;
    } else if (event_filter && event_filter.length > 0) {
      body['event_filter'] = event_filter;
    }
    if (is_active === 'yes' || is_active === 'no') {
      body['is_active'] = is_active === 'yes';
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/v2/webhooks/${villageApi.encodePathId(villageApi.requireText({ value: id, field: 'Webhook ID' }))}`,
      body,
    });
  },
});
