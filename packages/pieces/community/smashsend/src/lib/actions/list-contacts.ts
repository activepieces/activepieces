import { createAction, Property } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createClient } from '../common';

export const listContactsAction = createAction({
  auth: smashsendAuth,
  name: 'list_contacts',
  displayName: 'List Contacts',
  description: 'Lists contacts from SMASHSEND with pagination.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return (default: 15, max: 100).',
      required: false,
      defaultValue: 15,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination. Leave empty for first page.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order for the contacts.',
      required: false,
      defaultValue: 'createdAt.desc',
      options: {
        disabled: false,
        options: [
          { label: 'Newest First', value: 'createdAt.desc' },
          { label: 'Oldest First', value: 'createdAt.asc' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search term to filter contacts (searches email, name, phone).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter contacts by status.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: '' },
          { label: 'Subscribed', value: 'SUBSCRIBED' },
          { label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
          { label: 'Banned', value: 'BANNED' },
        ],
      },
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Additional filter criteria in JSON format. Example: {"company": "ACME", "role": "Manager"}',
      required: false,
    }),
    includeCount: Property.Checkbox({
      displayName: 'Include Total Count',
      description: 'Include total count of contacts in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { limit, cursor, sort, search, status, filter, includeCount } = context.propsValue;
    
    // Validate limit
    if (limit !== undefined) {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new Error('Limit must be a number between 1 and 100.');
      }
    }

    try {
      const client = createClient(context.auth.apiKey);
      
      const result = await client.contacts.list({
        limit: limit,
        cursor: cursor?.trim(),
        sort: sort as 'createdAt.desc' | 'createdAt.asc',
        search: search?.trim(),
        status: status || undefined,
        filter: filter,
        includeCount: includeCount,
      });
      
      return result;
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message?.includes('invalid cursor')) {
        throw new Error('Invalid pagination cursor. Please use a valid cursor from a previous response or leave empty for the first page.');
      }
      if (error.message?.includes('invalid sort')) {
        throw new Error('Invalid sort parameter. Please use \'createdAt.desc\' or \'createdAt.asc\'.');
      }
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your authentication settings.');
      }
      if (error.statusCode === 403) {
        throw new Error('API key does not have sufficient permissions to list contacts.');
      }
      throw new Error(`Failed to list contacts: ${error.message}`);
    }
  },
}); 