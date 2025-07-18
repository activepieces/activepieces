import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendReply = createAction({
  auth: helpScoutAuth,
  name: 'send_reply',
  displayName: 'Send Reply',
  description: 'Send a reply in an existing conversation (see Help Scout API docs for supported fields).',
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Reply Text',
      required: true,
    }),
    customerId: Property.Number({
      displayName: 'Customer ID',
      required: true,
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      required: false,
    }),
    imported: Property.Checkbox({
      displayName: 'Imported (historical)',
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
    userId: Property.Number({
      displayName: 'User ID (who adds the reply)',
      required: false,
    }),
    assignTo: Property.Number({
      displayName: 'Assign To User ID',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC (emails)',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC (emails)',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At (ISO Date, only with imported)',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      description: 'Array of {fileName, mimeType, data (base64)}',
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      conversationId: z.number().int().positive('Conversation ID must be a positive integer.'),
      text: z.string().min(1, 'Reply text cannot be empty.'),
      customerId: z.number().int().positive('Customer ID is required.'),
      draft: z.boolean().optional(),
      imported: z.boolean().optional(),
      status: z.enum(['active', 'pending', 'closed', 'spam']).optional(),
      userId: z.number().int().positive().optional(),
      assignTo: z.number().int().positive().optional(),
      cc: z.array(z.string().email('Invalid email in CC')).optional(),
      bcc: z.array(z.string().email('Invalid email in BCC')).optional(),
      createdAt: z.string().refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'Created At must be a valid ISO date string.' }
      ).optional(),
      attachments: z.array(z.object({
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        data: z.string().min(1),
      })).optional(),
    });
    const payload: Record<string, any> = {
      text: propsValue.text,
      customer: { id: propsValue.customerId },
      draft: propsValue.draft,
      imported: propsValue.imported,
      status: propsValue.status,
      user: propsValue.userId,
      assignTo: propsValue.assignTo,
      cc: propsValue.cc,
      bcc: propsValue.bcc,
      createdAt: propsValue.createdAt,
      attachments: propsValue.attachments,
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    return await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: `/conversations/${propsValue.conversationId}/reply`,
      auth,
      body: payload,
    });
  },
}); 