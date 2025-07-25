import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const createConversation = createAction({
  auth: helpScoutAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Start a new conversation (see Help Scout API docs for supported fields).',
  props: {
    mailboxId: Property.Number({
      displayName: 'Mailbox ID',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    customerId: Property.Number({
      displayName: 'Customer ID',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
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
    attachments: Property.Array({
      displayName: 'Attachment File Names',
      required: false,
    }),
  },
  async run({ auth, propsValue }): Promise<any> {
    await propsValidation.validateZod(propsValue, {
      mailboxId: z.number().int().positive('Mailbox ID must be a positive integer.'),
      subject: z.string().min(1, 'Subject cannot be empty.'),
      customerEmail: z.string().email().optional(),
      customerId: z.number().int().positive().optional(),
      body: z.string().min(1, 'Body cannot be empty.'),
      tags: z.array(z.string().min(1, 'Tags cannot contain empty strings.')).optional(),
      cc: z.array(z.string().email('Invalid email in CC')).optional(),
      bcc: z.array(z.string().email('Invalid email in BCC')).optional(),
      imported: z.boolean().optional(),
      attachments: z.array(z.string().min(1, 'Attachment file name cannot be empty')).optional(),
    });
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
    const customer = propsValue.customerId
      ? { id: propsValue.customerId }
      : { email: propsValue.customerEmail };
    const payload: Record<string, any> = {
      type: 'email',
      mailboxId: propsValue.mailboxId,
      subject: propsValue.subject,
      customer,
      threads: [
        {
          type: 'customer',
          body: propsValue.body,
          cc: propsValue.cc,
          bcc: propsValue.bcc,
          imported: propsValue.imported,
          attachments: propsValue.attachments,
        },
      ],
      tags: propsValue.tags,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    Object.keys(payload['threads'][0]).forEach((key) => {
      if (payload['threads'][0][key] === undefined || payload['threads'][0][key] === null) {
        delete payload['threads'][0][key];
      }
    });
    return await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: '/conversations',
      auth,
      body: payload,
    });
  },
}); 