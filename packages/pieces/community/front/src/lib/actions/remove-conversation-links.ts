import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown } from '../common/dropdown';

export const removeConversationLinks = createAction({
  auth: frontAuth,
  name: 'removeConversationLinks',
  displayName: 'Remove Conversation Links',
  description: 'Remove external links from a conversation in Front.',
  props: {
    conversation_id: conversationIdDropdown,
    links: Property.Array({
      displayName: 'Links',
      description: 'List of external URLs to remove from the conversation.',
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
    return await makeRequest(auth, HttpMethod.DELETE, path, body);
  },
});
