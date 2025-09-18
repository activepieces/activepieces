import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown } from '../common/dropdown';

export const addConversationLinks = createAction({
  auth: frontAuth,
  name: 'addConversationLinks',
  displayName: 'Add Conversation Links',
  description: 'Link external references (URLs) to a conversation.',
  props: {
    conversation_id: conversationIdDropdown,
    links: Property.Array({
      displayName: 'Links',
      description: 'List of external URLs to link to the conversation.',
      required: true,
      properties: {
        item: Property.ShortText({
          displayName: 'Link URL',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, links } = propsValue;
    const path = `/conversations/${conversation_id}/links`;
    const body = { links };
    return await makeRequest(auth.access_token, HttpMethod.POST, path, body);
  },
});