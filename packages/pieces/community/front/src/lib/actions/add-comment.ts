import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, teammateIdDropdown } from '../common/dropdown';

export const addComment = createAction({
  auth: frontAuth,
  name: 'addComment',
  displayName: 'Add Comment',
  description: 'Add a comment (internal note) to a conversation in Front.',
  props: {
    conversation_id: conversationIdDropdown,
    author_id: teammateIdDropdown,
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, author_id, body } = propsValue;
    const path = `/conversations/${conversation_id}/comments`;
    const requestBody: Record<string, unknown> = { body };
    if (author_id) requestBody['author_id'] = author_id;
    return await makeRequest(auth.access_token, HttpMethod.POST, path, requestBody);
  },
});