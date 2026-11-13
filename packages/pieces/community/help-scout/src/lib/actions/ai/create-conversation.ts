import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const aiCreateConversation = createAction({
  auth: helpScoutAuth,
  name: 'ai_create_conversation',
  classification: 'WRITE',
  displayName: 'Create Conversation (by ID)',
  description: 'Starts a new conversation using plain mailbox, customer and user IDs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Help Scout conversation in a mailbox with one initial thread. Identify the customer by customerId (from Find Customer) or customerEmail (a new customer is created if unknown). Get mailboxId from List Mailboxes and user IDs from List Users. Thread type "customer" records a message from the customer; "reply" sends an email to the customer. Not idempotent: every call creates a separate conversation, so search first if a duplicate would matter.',
    idempotent: false,
  },
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    mailboxId: Property.Number({ displayName: 'Mailbox ID', description: 'Numeric mailbox ID from List Mailboxes.', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', description: 'Required unless Customer ID is given.', required: false }),
    customerId: Property.Number({ displayName: 'Customer ID', description: 'Existing customer ID; takes precedence over Customer Email.', required: false }),
    type: Property.StaticDropdown({
      displayName: 'Conversation Type',
      required: false,
      defaultValue: 'email',
      options: { disabled: false, options: [{ label: 'Email', value: 'email' }, { label: 'Chat', value: 'chat' }, { label: 'Phone', value: 'phone' }] },
    }),
    threadType: Property.StaticDropdown({
      displayName: 'Thread Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Customer (message from the customer)', value: 'customer' },
          { label: 'Reply (email sent to the customer)', value: 'reply' },
          { label: 'Chat', value: 'chat' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
    text: Property.LongText({ displayName: 'Text', description: 'Body of the first thread. HTML is allowed.', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      defaultValue: 'active',
      options: { disabled: false, options: [{ label: 'Active', value: 'active' }, { label: 'Pending', value: 'pending' }, { label: 'Closed', value: 'closed' }] },
    }),
    assignTo: Property.Number({ displayName: 'Assign To User ID', required: false }),
    userId: Property.Number({ displayName: 'Created By User ID', description: 'Required by Help Scout for reply, chat and phone threads.', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    cc: Property.Array({ displayName: 'CC Emails', required: false }),
    bcc: Property.Array({ displayName: 'BCC Emails', required: false }),
  },
  async run({ auth, propsValue }) {
    const customerId = helpScoutApi.optionalNumber(propsValue.customerId);
    const customerEmail = propsValue.customerEmail?.trim();
    if (customerId === undefined && !customerEmail) {
      throw new Error('Provide either Customer ID or Customer Email.');
    }
    const body = helpScoutApi.buildConversationBody({
      type: propsValue.type ?? 'email',
      mailboxId: propsValue.mailboxId,
      subject: propsValue.subject,
      customerId,
      customerEmail,
      status: propsValue.status,
      threadType: propsValue.threadType,
      text: propsValue.text,
      tags: helpScoutApi.toStringList(propsValue.tags),
      cc: helpScoutApi.toStringList(propsValue.cc),
      bcc: helpScoutApi.toStringList(propsValue.bcc),
      userId: helpScoutApi.optionalNumber(propsValue.userId),
      assignTo: helpScoutApi.optionalNumber(propsValue.assignTo),
    });
    const response = await helpScoutApi.request({ method: HttpMethod.POST, path: '/conversations', auth, body });
    return { id: helpScoutApi.getResourceId(response.headers) };
  },
});
