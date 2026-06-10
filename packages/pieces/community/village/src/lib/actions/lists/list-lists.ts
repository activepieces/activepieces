import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listLists = createAction({
  auth: villageAuth,
  name: 'list_lists',
  displayName: 'List all lists',
  description:
    'Get all your saved lists of people or companies. Supports pagination, filtering by type, and searching by title.',
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

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/lists`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      queryParams,
    });
    return response.body;
  },
});
