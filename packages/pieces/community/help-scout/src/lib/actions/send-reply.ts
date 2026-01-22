import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, userIdDropdown } from '../common/props';

export const sendReply = createAction({
  auth: helpScoutAuth,
  name: 'send_reply',
  displayName: 'Send Reply',
  description: 'Sends a reply in an existing conversation.',
  props: {
    conversationId: conversationIdDropdown,
    text: Property.LongText({
      displayName: 'Reply Text',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: true,
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Conversation Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
          { label: 'Closed', value: 'closed' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    userId: userIdDropdown('User (who adds the reply)'),
    cc: Property.Array({
      displayName: 'CC (emails)',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC (emails)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const payload: Record<string, any> = {
      text: propsValue.text,
      customer: { email: propsValue.customerEmail },
      draft: propsValue.draft,
      status: propsValue.status,
      user: propsValue.userId,
      cc: propsValue.cc,
      bcc: propsValue.bcc,
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    const response = await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: `/conversations/${propsValue.conversationId}/reply`,
      auth,
      body: payload,
    });

    const replyId = response.headers?.['resource-id'];

    return {
      id:replyId
    }
  },
}); 