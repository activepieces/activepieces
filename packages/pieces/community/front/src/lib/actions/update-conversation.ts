import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, teammateDropdown, inboxDropdown, tagsMultiSelectDropdown } from '../common/props';

export const updateConversation = createAction({
  auth: frontAuth,
  name: 'update_conversation',
  displayName: 'Update Conversation',
  description: 'Modify conversation properties like status, assignee, inbox, and tags.',
  props: {
    conversation_id: conversationDropdown,
    assignee_id: teammateDropdown({
        displayName: 'Assignee',
        description: 'The teammate to assign the conversation to. Select "Unassign" from the status field to unassign.',
        required: false,
    }),
    inbox_id: {
        ...inboxDropdown,
        required: false
    },
    status: Property.StaticDropdown({
        displayName: 'Status',
        description: "Set a new status for the conversation.",
        required: false,
        options: {
            options: [
                { label: 'Open', value: 'open' },
                { label: 'Archived', value: 'archived' },
                { label: 'Spam', value: 'spam' },
                { label: 'Deleted', value: 'deleted' },
            ]
        }
    }),
    tag_ids: tagsMultiSelectDropdown({
        displayName: 'Tags',
        description: "A list of tags to apply. Note: This will replace all existing tags on the conversation.",
        required: false
    }),
    custom_fields: Property.Json({
        displayName: 'Custom Fields',
        description: 'Custom fields for this conversation. Note: This replaces all existing custom fields.',
        required: false
    })
  },
  async run(context) {
    const { conversation_id, ...body } = context.propsValue;
    const token = context.auth;

    // Remove undefined properties so we only send the fields the user wants to update
    Object.keys(body).forEach(key => {
        if (body[key as keyof typeof body] === undefined) {
            delete body[key as keyof typeof body];
        }
    });

    // The API returns a 204 No Content, so we don't expect a body back
    await makeRequest(
        token,
        HttpMethod.PATCH,
        `/conversations/${conversation_id}`,
        body
    );

    return { success: true };
  },
});