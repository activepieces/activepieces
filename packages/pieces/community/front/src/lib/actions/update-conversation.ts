import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateConversation = createAction({
  auth: frontAuth,
  name: 'updateConversation',
  displayName: 'Update Conversation',
  description: 'Modify conversation properties: status, assignee, inbox, tags, etc.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to update.',
      required: true,
    }),
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
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The ID of the teammate to assign the conversation to.',
      required: false,
    }),
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'The ID of the inbox to move the conversation to.',
      required: false,
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'List of tag IDs to set on the conversation.',
      required: false,
      properties: {
        item: Property.ShortText({
          displayName: 'Tag ID',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, status, assignee_id, inbox_id, tag_ids } = propsValue;
    const path = `/conversations/${conversation_id}`;
    const body: Record<string, unknown> = {};
    if (status) body['status'] = status;
    if (assignee_id) body['assignee_id'] = assignee_id;
    if (inbox_id) body['inbox_id'] = inbox_id;
    if (tag_ids) body['tag_ids'] = tag_ids;

    return await makeRequest(auth.access_token, HttpMethod.PATCH, path, body);
  },
});