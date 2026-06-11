import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const pollEvents = createAction({
  auth: agentlineAuth,
  name: 'poll_events',
  displayName: 'Peek Events',
  description:
    'Peek at pending events (call completions, SMS, inbound calls) without consuming them. Use triggers for automatic event-driven flows instead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Peeks at pending events in the Agentline event mailbox WITHOUT consuming them. Returns call transcripts, inbound SMS, and call notifications. Safe to use alongside triggers. For automatic event-driven flows, use the New Call Completed, New SMS Received, or New Inbound Call triggers instead.',
    idempotent: true,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'Filter events for a specific agent (optional)',
      required: false,
    }),
    event_type: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Filter by event type (optional)',
      required: false,
      options: {
        options: [
          { label: 'Call Completed', value: 'call.completed' },
          { label: 'Call Received', value: 'call.received' },
          { label: 'SMS Received', value: 'sms.received' },
        ],
      },
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.agent_id) {
      queryParams['agent_id'] = context.propsValue.agent_id;
    }
    if (context.propsValue.event_type) {
      queryParams['event_type'] = context.propsValue.event_type;
    }

    // Use /peek (non-destructive) instead of /events (consume)
    // so this action doesn't steal events from active triggers.
    const response = await agentlineApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/v1/events/peek',
      undefined,
      queryParams,
    );
    return response.body;
  },
});
