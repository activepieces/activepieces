import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const findConversation = createAction({
  auth: helpScoutAuth,
  name: 'find_conversation',
  displayName: 'Find Conversation',
  description: 'Locate a conversation by query, mailbox, status, tags, customer, or modified date.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: false,
    }),
    mailboxId: Property.Number({
      displayName: 'Mailbox ID',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    modifiedSince: Property.ShortText({
      displayName: 'Modified Since (ISO Date)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.query && !propsValue.mailboxId && !propsValue.status && !propsValue.tags && !propsValue.customerEmail && !propsValue.modifiedSince) {
      throw new Error('At least one search parameter must be provided.');
    }
    await propsValidation.validateZod(propsValue, {
      query: z.string().optional(),
      mailboxId: z.number().int().positive('Mailbox ID must be a positive integer.').optional(),
      status: z.enum(['active', 'closed', 'pending', 'spam']).optional(),
      tags: z.array(z.string().min(1, 'Tags cannot contain empty strings.')).optional(),
      customerEmail: z.string().email('Customer email must be valid.').optional(),
      modifiedSince: z.string().refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'Modified Since must be a valid ISO date string.' }
      ).optional(),
    });
    if (propsValue.tags) {
      const uniqueTags = new Set(propsValue.tags);
      if (uniqueTags.size !== propsValue.tags.length) {
        throw new Error('Tags must be unique.');
      }
    }
    const queryParams: Record<string, any> = {};
    if (propsValue.query) queryParams['query'] = propsValue.query;
    if (propsValue.mailboxId) queryParams['mailbox'] = propsValue.mailboxId;
    if (propsValue.status) queryParams['status'] = propsValue.status;
    if (propsValue.tags) queryParams['tags'] = propsValue.tags.join(',');
    if (propsValue.customerEmail) queryParams['customer'] = propsValue.customerEmail;
    if (propsValue.modifiedSince) queryParams['modifiedSince'] = propsValue.modifiedSince;
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/search/conversations',
      auth,
      queryParams,
    });
    return response;
  },
}); 