import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';

export const createConversation = createAction({
  auth: helpScoutAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Start a new conversation.',
  props: {
    mailboxId: mailboxIdDropdown(true),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: true,
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
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
    assignTo: userIdDropdown('Assigned User'),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    imported: Property.Checkbox({
      displayName: 'Imported',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.tags) {
      const uniqueTags = new Set(propsValue.tags);
      if (uniqueTags.size !== propsValue.tags.length) {
        throw new Error('Tags must be unique.');
      }
    }
    if (propsValue.cc) {
      const uniqueCC = new Set(propsValue.cc);
      if (uniqueCC.size !== propsValue.cc.length) {
        throw new Error('CC emails must be unique.');
      }
    }
    if (propsValue.bcc) {
      const uniqueBCC = new Set(propsValue.bcc);
      if (uniqueBCC.size !== propsValue.bcc.length) {
        throw new Error('BCC emails must be unique.');
      }
    }
    const customer = { email: propsValue.customerEmail };
    const payload: Record<string, any> = {
      type: 'chat',
      mailboxId: propsValue.mailboxId,
      subject: propsValue.subject,
      customer,
      status: propsValue.status,
      threads: [
        {
          type: propsValue.threadType,
          text: propsValue.body,
          customer,
          imported: propsValue.imported,
          ...(propsValue.cc &&
            propsValue.threadType === 'customer' &&
            propsValue.cc.length > 0 && { cc: propsValue.cc }),
          ...(propsValue.bcc &&
            propsValue.threadType === 'customer' &&
            propsValue.bcc.length > 0 && { bcc: propsValue.bcc }),
        },
      ],
      tags: propsValue.tags,
      ...(propsValue.assignTo && { assignTo: Number(propsValue.assignTo) }),
      ...(propsValue.fromUser && { user: Number(propsValue.fromUser) }),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    Object.keys(payload['threads'][0]).forEach((key) => {
      if (
        payload['threads'][0][key] === undefined ||
        payload['threads'][0][key] === null
      ) {
        delete payload['threads'][0][key];
      }
    });
    const response =  await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: '/conversations',
      auth,
      body: payload,
    });

    const convoId = response.headers?.['resource-id'];

    return {
      id:convoId
    }
  },
});
