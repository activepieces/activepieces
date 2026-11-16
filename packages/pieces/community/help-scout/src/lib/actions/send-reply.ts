import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { conversationIdDropdown, userIdDropdown } from '../common/props';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const sendReply = createAction({
  auth: helpScoutAuth,
  name: 'send_reply',
  classification: 'WRITE',
  displayName: 'Send Reply',
  description: 'Sends a reply in an existing conversation.',
  audience: 'human',
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    conversationId: conversationIdDropdown,
    text: Property.LongText({ displayName: 'Reply Text', required: true }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', required: true }),
    draft: Property.Checkbox({ displayName: 'Draft', required: false }),
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
    cc: Property.Array({ displayName: 'CC (emails)', required: false }),
    bcc: Property.Array({ displayName: 'BCC (emails)', required: false }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.conversationId) {
      throw new Error('Select the conversation to reply to.');
    }
    const body = helpScoutApi.buildReplyBody({
      text: propsValue.text,
      customerEmail: propsValue.customerEmail,
      draft: propsValue.draft ? true : undefined,
      status: propsValue.status ?? undefined,
      userId: helpScoutApi.optionalNumber(propsValue.userId),
      cc: helpScoutApi.toStringList(propsValue.cc),
      bcc: helpScoutApi.toStringList(propsValue.bcc),
    });
    const response = await helpScoutApi.request({
      method: HttpMethod.POST,
      path: `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}/reply`,
      auth,
      body,
    });
    return { id: helpScoutApi.getResourceId(response.headers) };
  },
});
