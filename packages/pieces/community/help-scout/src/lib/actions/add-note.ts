import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const addNote = createAction({
  auth: helpScoutAuth,
  name: 'add_note',
  displayName: 'Add Note',
  description: 'Add an internal note to a conversation (see Help Scout API docs for supported fields).',
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Note Text',
      required: true,
    }),
    userId: Property.Number({
      displayName: 'User ID (who adds the note)',
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
    imported: Property.Checkbox({
      displayName: 'Imported (historical)',
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
      text: z.string().min(1, 'Note text cannot be empty.'),
      userId: z.number().int().positive().optional(),
      status: z.enum(['active', 'pending', 'closed', 'spam']).optional(),
      imported: z.boolean().optional(),
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
      attachments: propsValue.attachments,
      user: propsValue.userId,
      status: propsValue.status,
      imported: propsValue.imported,
      createdAt: propsValue.createdAt,
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    return await helpScoutApiRequest({
      method: HttpMethod.POST,
      url: `/conversations/${propsValue.conversationId}/notes`,
      auth,
      body: payload,
    });
  },
}); 