import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

const WEBHOOK_EVENT_TYPE = 'conversation_tagged';

export const newTagAdded = createTrigger({
  auth: frontAuth,
  name: 'new_tag_added',
  displayName: 'New Tag Added to Conversation',
  description: 'Fires when a tag is applied to a conversation.',
  props: {
    tag_ids: frontProps.tags({
      displayName: 'Filter by Tags',
      description:
        'Only trigger when one of these specific tags is added. Leave empty to trigger for any tag.',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'tag_klmno789',
    name: 'Urgent',
    highlight: 'red',
    is_private: false,
    conversation_id: 'cnv_fghij456',
  },

  async onEnable(context) {
    const token = context.auth;
    const response = await makeRequest<{ id: string }>(
      token,
      HttpMethod.POST,
      '/events',
      {
        target_url: context.webhookUrl,
        events: [WEBHOOK_EVENT_TYPE],
      }
    );

    await context.store.put(`front_new_tag_webhook`, {
      webhookId: response.id,
    });
  },

  async onDisable(context) {
    const token = context.auth;
    const webhookData = await context.store.get<{ webhookId: string }>(
      `front_new_tag_webhook`
    );

    if (webhookData?.webhookId) {
      await makeRequest(
        token,
        HttpMethod.DELETE,
        `/events/${webhookData.webhookId}`
      );
      await context.store.delete(`front_new_tag_webhook`);
    }
  },

  async run(context) {
    const eventBody = context.payload.body as {
      payload: { id: string };
      target: { _meta: { conversation_id: string } };
    };
    const tagIdsToFilter = context.propsValue.tag_ids || [];

    if (
      tagIdsToFilter.length > 0 &&
      !tagIdsToFilter.includes(eventBody.payload.id)
    ) {
      return [];
    }

    const result = {
      ...eventBody.payload,
      conversation_id: eventBody.target._meta.conversation_id,
    };

    return [result];
  },
});
