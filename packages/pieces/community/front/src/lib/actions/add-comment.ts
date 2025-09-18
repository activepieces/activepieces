import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addComment = createAction({
  auth: frontAuth,
  name: 'addComment',
  displayName: 'Add Comment',
  description: 'Add a comment (internal note) to a conversation in Front.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to add a comment to.',
      required: true,
    }),
    author_id: Property.ShortText({
      displayName: 'Author ID',
      description: 'The ID of the teammate adding the comment.',
      required: false,
    }),
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