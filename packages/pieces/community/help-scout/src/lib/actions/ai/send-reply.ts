import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const aiSendReply = createAction({
  auth: helpScoutAuth,
  name: 'ai_send_reply',
  classification: 'WRITE',
  displayName: 'Send Reply (by ID)',
  description: 'Sends a reply in a conversation identified by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a customer-facing reply to an existing Help Scout conversation; unless draft is "yes" Help Scout emails it to the customer. Identify the recipient by customerId or customerEmail (use the conversation primaryCustomer from Get Conversation). Use Add Note instead for internal-only text. Not idempotent: each call sends another reply.',
    idempotent: false,
  },
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    text: Property.LongText({ displayName: 'Reply Text', description: 'HTML is allowed.', required: true }),
    customerId: Property.Number({ displayName: 'Customer ID', description: 'Takes precedence over Customer Email.', required: false }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', required: false }),
    draft: Property.StaticDropdown({
      displayName: 'Save As Draft',
      description: 'yes saves a draft without sending; leave empty to send.',
      required: false,
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    status: Property.StaticDropdown({
      displayName: 'Conversation Status After Reply',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
          { label: 'Closed', value: 'closed' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    userId: Property.Number({ displayName: 'Sent By User ID', description: 'Defaults to the connected user.', required: false }),
    cc: Property.Array({ displayName: 'CC Emails', required: false }),
    bcc: Property.Array({ displayName: 'BCC Emails', required: false }),
  },
  async run({ auth, propsValue }) {
    const customerId = helpScoutApi.optionalNumber(propsValue.customerId);
    const customerEmail = propsValue.customerEmail?.trim();
    if (customerId === undefined && !customerEmail) {
      throw new Error('Provide either Customer ID or Customer Email.');
    }
    const body = helpScoutApi.buildReplyBody({
      text: propsValue.text,
      customerId,
      customerEmail,
      draft: helpScoutApi.yesNoToBoolean(propsValue.draft),
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
