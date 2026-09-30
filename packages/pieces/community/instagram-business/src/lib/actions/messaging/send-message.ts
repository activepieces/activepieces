import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { sendMessageOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const sendMessage = createAction({
  auth: instagramCommon.authentication,
  outputSchema: sendMessageOutputSchema,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send a direct message to an Instagram user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a text direct message to one Instagram user, addressed by their Instagram-scoped user id as supplied by a New Message trigger or List Conversations. Instagram only allows a reply within 24 hours of that user last messaging the account, so an older thread is rejected. Not idempotent, since each call sends another message.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    recipient_id: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'The Instagram-scoped user id of the person to message.',
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
        recipient: { id: propsValue.recipient_id },
        message: { text: propsValue.text },
      },
    });

    return {
      message_id: result.message_id,
      recipient_id: result.recipient_id ?? propsValue.recipient_id,
    };
  },
});
