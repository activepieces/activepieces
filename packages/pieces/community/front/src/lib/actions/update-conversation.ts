import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

interface FrontTag {
  id: string;
  name: string;
}

export const updateConversation = createAction({
  auth: frontAuth,
  name: 'update_conversation',
  displayName: 'Update Conversation',
  description: 'Modify conversation properties like status, assignee, inbox, and tags.',
  props: {
    conversation_id: frontProps.conversation({ required: true }),
    assignee_id: frontProps.teammate({
      displayName: 'Assignee',
      description: 'The teammate to assign the conversation to.',
      required: false,
    }),
    inbox_id: frontProps.channel({
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
    tags: frontProps.tags({
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
    const { conversation_id, ...body } = context.propsValue;
    const token = context.auth;
    const requestBody = { ...body };


    if (requestBody.tags) {
        const tagsResponse = await makeRequest<{ _results: FrontTag[] }>(
            token,
            HttpMethod.GET,
            '/tags'
        );
        const allTags = tagsResponse._results;

        const tagNames = (requestBody.tags as string[]).map(tagId => {
            const foundTag = allTags.find(tag => tag.id === tagId);
            return foundTag ? foundTag.name : null;
        }).filter((name): name is string => name !== null); 
        requestBody.tags = tagNames;
    }
    
    Object.keys(requestBody).forEach(key => {
      if ((requestBody as Record<string, unknown>)[key] === undefined) {
        delete (requestBody as Record<string, unknown>)[key];
      }
    });
    delete (body as Record<string, unknown>)['auth'];

    if (Object.keys(requestBody).length > 0) {
      await makeRequest(
        token,
        HttpMethod.PATCH,
        `/conversations/${conversation_id}`,
        requestBody
      );
    }

    return { success: true };
  },
});