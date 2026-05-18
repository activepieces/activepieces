import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const addCommentToConversation = createAction({
  auth: respondIoAuth,
  name: 'add_comment_to_conversation',
  displayName: 'Add Comment to Conversation',
  description: 'Add an internal comment/note to a conversation in Respond.io.',
  props: {
    identifier: contactIdentifierDropdown,
    text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'The internal comment to add (max 1000 characters). You can mention users with {{@user.ID}} format where ID is the user ID.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, text } = propsValue;

    if (!text || text.trim().length === 0) {
      throw new Error('Comment text is required and cannot be empty.');
    }
    if (text.length > 1000) {
      throw new Error(`Comment text is too long (${text.length} characters). Maximum allowed is 1000 characters.`);
    }

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/${identifier}/comment`,
      auth: auth,
      body: {
        text: text.trim(),
      },
    });
  },
});
