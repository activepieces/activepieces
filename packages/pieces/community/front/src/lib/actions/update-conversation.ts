import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  conversationIdDropdown,
  inboxIdDropdown,
  tagIdsDropdown,
  teammateIdDropdown,
} from '../common/dropdown';

export const updateConversation = createAction({
  auth: frontAuth,
  name: 'updateConversation',
  displayName: 'Update Conversation',
  description:
    'Modify conversation properties: status, assignee, inbox, tags, etc.',
  props: {
    conversation_id: conversationIdDropdown,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The new status for the conversation.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Archived', value: 'archived' },
          { label: 'Deleted', value: 'deleted' },
        ],
      },
    }),
    assignee_id: teammateIdDropdown,
    inbox_id: inboxIdDropdown,
    tag_ids: tagIdsDropdown,
  },
  async run({ auth, propsValue }) {
    const { conversation_id, status, assignee_id, inbox_id, tag_ids } =
      propsValue;
    const path = `/conversations/${conversation_id}`;
    const body: Record<string, unknown> = {};
    if (status) body['status'] = status;
    if (assignee_id) body['assignee_id'] = assignee_id;
    if (inbox_id) body['inbox_id'] = inbox_id;
    if (tag_ids) body['tag_ids'] = tag_ids;

    await makeRequest(auth, HttpMethod.PATCH, path, body);
    return {
      success: true,
      message: `Conversation ${conversation_id} updated successfully`,
    };
  },
});
