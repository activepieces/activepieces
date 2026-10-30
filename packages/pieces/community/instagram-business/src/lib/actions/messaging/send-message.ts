import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

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
      'Sends a text direct message to one Instagram user, addressed by their Instagram-scoped user id as supplied by List Conversations or List Messages. Instagram only allows a reply within 24 hours of that user last messaging the account, so an older thread is rejected. Not idempotent, since each call sends another message.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'recipient', display: 'section', label: 'Send to', icon: 'send', props: ['window_info', 'recipient_id'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['text'] },
  ],
  props: {
    page: instagramCommon.page,
    window_info: Property.MarkDown({
      value: 'Instagram only delivers to people who messaged you in the last 24 hours.',
      variant: MarkdownVariant.INFO,
    }),
    recipient_id: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'Their Instagram-scoped id, from List Conversations or List Messages.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      placeholder: 'Thanks for reaching out! How can we help?',
      required: true,
    }),
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
