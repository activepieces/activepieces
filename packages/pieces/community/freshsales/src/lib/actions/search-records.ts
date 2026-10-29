import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { searchRecordsOutputSchema } from '../output-schemas';

export const searchRecords = createAction({
  auth: freshsalesAuth,
  name: 'search_records',
  displayName: 'Search Records',
  description: 'Search contacts, accounts and deals by keyword',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Full-text search across Freshsales contacts, accounts and deals (choose which types). Returns up to Limit matches with id, type, name and email. Use it to find a record ID by partial name; use Get Contact/Account/Deal for full details.',
    idempotent: true,
  },
  outputSchema: searchRecordsOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Term',
      description: 'Text to search for',
      placeholder: 'acme',
      required: true,
    }),
    entities: Property.StaticMultiSelectDropdown({
      displayName: 'Record Types',
      description: 'Types to search; leave empty to search all',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Contacts', value: 'contact' },
          { label: 'Accounts', value: 'sales_account' },
          { label: 'Deals', value: 'deal' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum results to return (1-100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const query = context.propsValue.query.trim();
    if (query.length === 0) {
      throw new Error('Search Term is required.');
    }
    const limit = context.propsValue.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Limit must be a whole number between 1 and 100.');
    }
    const entities = context.propsValue.entities ?? [];
    const include = entities.length > 0 ? entities.join(',') : 'contact,sales_account,deal';
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/search',
      query: { q: query, include, per_page: String(limit) },
    });
    const results = Array.isArray(response)
      ? response.filter((item) => freshsalesClient.isRecord(item))
      : [];
    return { results, count: results.length };
  },
});
