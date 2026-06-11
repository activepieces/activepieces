import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const listCalls = createAction({
  auth: agentlineAuth,
  name: 'list_calls',
  displayName: 'List Calls',
  description: 'List calls with optional filters for agent and status',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists voice calls made through Agentline with optional filters. Returns call IDs, statuses, timestamps, and phone numbers. Safe to call repeatedly.',
    idempotent: true,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'Filter by agent ID (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by call status (optional)',
      required: false,
      options: {
        options: [
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'Initiated', value: 'initiated' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return (default: 50)',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.agent_id) {
      queryParams['agent_id'] = context.propsValue.agent_id;
    }
    if (context.propsValue.status) {
      queryParams['status'] = context.propsValue.status;
    }
    if (context.propsValue.limit) {
      queryParams['limit'] = String(context.propsValue.limit);
    }

    const response = await agentlineApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/v1/calls',
      undefined,
      queryParams,
    );
    return response.body;
  },
});
