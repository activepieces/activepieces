import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const addComment = createAction({
  auth: frontAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Add a comment to a conversation (internal note).',
  props: {
    conversation_id: frontProps.conversation(),
    author_id: frontProps.teammate({
      displayName: 'Author',
      description: 'The teammate posting the comment.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'The content of the comment. HTML is supported.',
      required: true,
    }),
  },
  async run(context) {
    const { conversation_id, author_id, body } = context.propsValue;
    const token = context.auth;
    const requestBody = { author_id, body };

    return await makeRequest(
      token,
      HttpMethod.POST,
      `/conversations/${conversation_id}/comments`,
      requestBody
    );
  },
});
