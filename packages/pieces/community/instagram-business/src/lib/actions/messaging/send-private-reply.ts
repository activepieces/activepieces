import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { sendMessageOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const sendPrivateReply = createAction({
  auth: instagramCommon.authentication,
  outputSchema: sendMessageOutputSchema,
  name: 'send_private_reply',
  classification: 'WRITE',
  displayName: 'Send Private Reply',
  description: 'Reply privately by direct message to someone who commented.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a direct message to the author of a comment, given the comment id rather than a user id, which is how Instagram supports the comment-to-DM pattern. Allowed once per comment and only within 7 days of it, and unlike Send Message it does not need an existing conversation. Not idempotent, and a second private reply to the same comment is rejected.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The comment whose author should receive the direct message.',
      required: true,
    }),
    text: Property.LongText({ displayName: 'Message', required: true }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const pageId = instagramCommon.requirePageId(page);

    const result = await instagramCommon.graphRequest<{
      recipient_id?: string;
      message_id?: string;
    }>({
      method: HttpMethod.POST,
      resourceUri: `/${pageId}/messages`,
      accessToken: page.accessToken,
      body: {
        recipient: { comment_id: propsValue.comment_id },
        message: { text: propsValue.text },
      },
    });

    return {
      message_id: result.message_id,
      recipient_id: result.recipient_id,
    };
  },
});
