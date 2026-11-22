import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getList = createAction({
  auth: villageAuth,
  name: 'get_list',
  classification: 'READ',
  displayName: 'Get a list',
  description:
    'Get a list with all its items. Returns the list metadata plus paginated items. For people lists, items are sorted by connection strength (warmth score).',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single list by ID along with its items, paginated via an opaque cursor. Read-only and idempotent. Use this to read members of one known list (and to obtain item IDs for removal); use List all lists to discover list IDs first.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getList,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/lists/${encodeURIComponent(id)}`,
      queryParams,
    });
    return response;
  },
});
