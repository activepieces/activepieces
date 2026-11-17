import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listLists = createAction({
  auth: villageAuth,
  name: 'list_lists',
  classification: 'SEARCH',
  displayName: 'List all lists',
  description:
    'Get all your saved lists of people or companies. Supports pagination, filtering by type, and searching by title.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the caller\'s saved lists, with optional cursor pagination, type filter (people or company), and title search. Read-only and idempotent. Use to discover list IDs and titles; use Get a list to read the items inside a specific list.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listLists,
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Opaque cursor for pagination (from previous response)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of lists per page (max 100)',
      required: false,
      defaultValue: 20,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Filter lists by type',
      required: false,
      options: {
        options: [
          { label: 'People', value: 'people' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search lists by title',
      required: false,
    }),
  },
  async run(context) {
    const { cursor, limit, type, search } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (cursor) queryParams['cursor'] = cursor;
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);
    if (type) queryParams['type'] = type;
    if (search) queryParams['search'] = search;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/lists`,
      queryParams,
    });
    return response;
  },
});
