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
  audience: 'both',
  aiMetadata: { description: 'Posts an internal comment (note visible to team members, not the contact) on a contact\'s conversation in Respond.io. Use to leave context for agents rather than to message the contact. Requires the contact identifier and comment text (max 1000 chars); supports @-mentioning users via {{@user.ID}}. Not idempotent — each call appends another comment.', idempotent: false },
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
