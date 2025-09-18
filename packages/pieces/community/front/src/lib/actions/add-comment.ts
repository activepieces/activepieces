import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, teammateDropdown } from '../common/props';

export const addComment = createAction({
  auth: frontAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Add a comment (internal note) to a conversation.',
  props: {
    conversation_id: conversationDropdown,
    body: Property.LongText({
        displayName: 'Body',
        description: 'The content of the comment. Markdown is supported.',
        required: true,
    }),
    author_id: teammateDropdown({
        displayName: 'Author',
        description: "The teammate creating the comment. Defaults to the connection's owner.",
        required: false,
    }),
  },
  async run(context) {
    const { conversation_id, ...body } = context.propsValue;
    const token = context.auth;

    // Remove author_id if it wasn't provided
    if (!body.author_id) {
        delete body.author_id;
    }

    return await makeRequest(
        token,
        HttpMethod.POST,
        `/conversations/${conversation_id}/comments`,
        body
    );
  },
});