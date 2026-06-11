import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const pollEvents = createAction({
  auth: agentlineAuth,
  name: 'poll_events',
  displayName: 'Poll Events',
  description:
    'Consume pending events (call completions, SMS, inbound calls) from the mailbox',
  audience: 'both',
  aiMetadata: {
    description:
      'Consumes pending events from the Agentline event mailbox. Events are auto-deleted after retrieval. Returns call transcripts, inbound SMS, and call notifications. Not idempotent — events are consumed once.',
    idempotent: false,
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

    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.GET,
      '/v1/events',
      undefined,
      queryParams,
    );
    return response.body;
  },
});
