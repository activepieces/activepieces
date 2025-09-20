import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const updateConversation = createAction({
  auth: frontAuth,
  name: 'update_conversation',
  displayName: 'Update Conversation',
  description:
    'Modify conversation properties like status, assignee, inbox, and tags.',
  props: {
    conversation_id: frontProps.conversation({ required: true }),
    assignee_id: frontProps.teammate({
      displayName: 'Assignee',
      description:
        'The teammate to assign the conversation to. Set it to null to unassign.',
      required: false,
    }),
    inbox_id: frontProps.inbox({
      displayName: 'Inbox',
      description: 'The inbox to move the conversation to.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Set a new status for the conversation.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Archived', value: 'archived' },
          { label: 'Spam', value: 'spam' },
          { label: 'Deleted', value: 'deleted' },
        ],
      },
    }),
    tag_ids: frontProps.tags({
      displayName: 'Tags',
      description:
        'A list of tags to apply. Note: This will replace all existing tags on the conversation.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'Custom fields for this conversation. Note: This replaces all existing custom fields.',
      required: false,
    }),
  },
  async run(context) {
    const {
      conversation_id,
      assignee_id,
      inbox_id,
      status,
      tag_ids,
      custom_fields,
    } = context.propsValue;
    const token = context.auth;

    const body = {
      assignee_id,
      inbox_id,
      status,
      tag_ids,
      custom_fields,
    };

    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined)
    );

    await makeRequest(
      token,
      HttpMethod.PATCH,
      `/conversations/${conversation_id}`,
      cleanBody
    );

    return { success: true };
  },
});
