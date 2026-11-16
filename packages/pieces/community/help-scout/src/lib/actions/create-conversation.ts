import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const createConversation = createAction({
  auth: helpScoutAuth,
  name: 'create_conversation',
  classification: 'WRITE',
  displayName: 'Create Conversation',
  description: 'Start a new conversation.',
  audience: 'human',
  outputSchema: helpScoutOutputSchemas['createdId'],
  props: {
    mailboxId: mailboxIdDropdown(true),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', required: true }),
    conversationType: Property.StaticDropdown({
      displayName: 'Conversation Type',
      description: 'Defaults to Chat, which is what earlier versions of this step always created.',
      required: false,
      defaultValue: 'chat',
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Chat', value: 'chat' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
    fromUser: userIdDropdown('From User'),
    threadType: Property.StaticDropdown({
      displayName: 'Thread Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Chat', value: 'chat' },
          { label: 'Phone', value: 'phone' },
          { label: 'Reply', value: 'reply' },
          { label: 'Customer', value: 'customer' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Conversation Status',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
    body: Property.LongText({ displayName: 'Body', required: true }),
    assignTo: userIdDropdown('Assigned User'),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    cc: Property.Array({ displayName: 'CC', required: false }),
    bcc: Property.Array({ displayName: 'BCC', required: false }),
    imported: Property.Checkbox({ displayName: 'Imported', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = helpScoutApi.buildConversationBody({
      type: propsValue.conversationType ?? 'chat',
      mailboxId: Number(propsValue.mailboxId),
      subject: propsValue.subject,
      customerEmail: propsValue.customerEmail,
      status: propsValue.status,
      threadType: propsValue.threadType,
      text: propsValue.body,
      tags: helpScoutApi.uniqueOrThrow({ values: helpScoutApi.toStringList(propsValue.tags), label: 'Tags' }),
      cc: helpScoutApi.uniqueOrThrow({ values: helpScoutApi.toStringList(propsValue.cc), label: 'CC emails' }),
      bcc: helpScoutApi.uniqueOrThrow({ values: helpScoutApi.toStringList(propsValue.bcc), label: 'BCC emails' }),
      userId: helpScoutApi.optionalNumber(propsValue.fromUser),
      assignTo: helpScoutApi.optionalNumber(propsValue.assignTo),
      imported: propsValue.imported ? true : undefined,
    });
    const response = await helpScoutApi.request({
      method: HttpMethod.POST,
      path: '/conversations',
      auth,
      body,
    });
    return { id: helpScoutApi.getResourceId(response.headers) };
  },
});
