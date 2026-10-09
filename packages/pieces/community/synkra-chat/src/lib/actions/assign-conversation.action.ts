import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const assignConversationAction = createAction({
  auth: synkraChatAuth,
  name: 'assign_conversation',
  displayName: 'Assign Conversation',
  description: 'Assign a conversation to an agent or a team.',
  props: {
    conversation_id: Property.Number({ displayName: 'Conversation ID', required: true }),
    assignee_id: Property.Number({
      displayName: 'Agent ID',
      description: 'Leave empty to assign to a team instead.',
      required: false,
    }),
    team_id: Property.Number({
      displayName: 'Team ID',
      description: 'Leave empty if assigning to an agent.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.assignee_id) body.assignee_id = propsValue.assignee_id;
    if (propsValue.team_id) body.team_id = propsValue.team_id;

    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/conversations/${propsValue.conversation_id}/assignments`,
      body,
    });
  },
});
