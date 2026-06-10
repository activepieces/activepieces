import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const getList = createAction({
  auth: villageAuth,
  name: 'get_list',
  displayName: 'Get a list',
  description:
    'Get a list with all its items. Returns the list metadata plus paginated items. For people lists, items are sorted by connection strength (warmth score).',
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Opaque cursor for items pagination (from previous response)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of items per page (max 100)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { id, cursor, limit } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (cursor) queryParams['cursor'] = cursor;
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/${encodeURIComponent(id)}`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      queryParams,
    });
    return response.body;
  },
});
