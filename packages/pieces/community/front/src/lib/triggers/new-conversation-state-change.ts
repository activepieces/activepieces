import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_EVENTS = [
  'conversation_archived',
  'conversation_reopened',
  'conversation_deleted',
  'conversation_restored',
  'conversation_assigned',
  'conversation_unassigned',
];

export const newConversationStateChange = createTrigger({
  auth: frontAuth,
  name: 'new_conversation_state_change',
  displayName: 'New Conversation State Change',
  description:
    'Fires when a conversation is archived, reopened, assigned, etc.',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'State Changes',
      description:
        'Select the specific state changes you want to trigger on. Leave empty to trigger on all state changes.',
      required: false,
      options: {
        options: WEBHOOK_EVENTS.map((event) => ({
          label: event
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          value: event,
        })),
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_abcde122',
    type: 'conversation_archived',
    timestamp: 1678886404.567,
    payload: {
      conversation: {
        id: 'cnv_fghij456',
        subject: 'Question about my recent order',
        status: 'archived',
      },
    },
  },

  async onEnable(context) {
    const token = context.auth;
    const response = await makeRequest<{ id: string }>(
      token,
      HttpMethod.POST,
      '/events',
      {
        target_url: context.webhookUrl,
        events: WEBHOOK_EVENTS,
      }
    );

    await context.store.put(`front_conversation_state_webhook`, {
      webhookId: response.id,
    });
  },

  async onDisable(context) {
    const token = context.auth;
    const webhookData = await context.store.get<{ webhookId: string }>(
      `front_conversation_state_webhook`
    );

    if (webhookData?.webhookId) {
      await makeRequest(
        token,
        HttpMethod.DELETE,
        `/events/${webhookData.webhookId}`
      );
      await context.store.delete(`front_conversation_state_webhook`);
    }
  },

  async run(context) {
    const eventBody = context.payload.body as { type: string };
    const eventTypesToFilter = context.propsValue.event_types || [];

    if (
      eventTypesToFilter.length > 0 &&
      !eventTypesToFilter.includes(eventBody.type)
    ) {
      return [];
    }

    return [eventBody];
  },
});
