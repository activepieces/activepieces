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
  audience: 'both',
  aiMetadata: {
    description:
      'Detach external links (by URL) from a Front conversation, the inverse of "Add Conversation Links". Use to clean up associations no longer relevant to the thread. Effectively idempotent: removing a link not present leaves the conversation unchanged.',
    idempotent: true,
  },
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
