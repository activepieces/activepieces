import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listCompanies = createAction({
  auth: villageAuth,
  name: 'list_companies',
  displayName: 'List Companies',
  description:
    'Get your top-connected companies ranked by network strength. Returns a paginated list with connection score, label, LinkedIn URL, domain, and enrichment data.',
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Opaque cursor for pagination (from previous response)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results per page (default 25, max 100)',
      required: false,
    }),
    connection_degrees: Property.Array({
      displayName: 'Connection Degrees',
      description:
        'Filter by connection degree (1=direct, 2=second-degree, 3=third-degree). Provide one or more values.',
      required: false,
    }),
  },
  async run(context) {
    const { cursor, limit, connection_degrees } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (cursor !== undefined) body['cursor'] = cursor;
    if (limit !== undefined) body['limit'] = limit;
    if (connection_degrees !== undefined && Array.isArray(connection_degrees)) {
      body['connection_degrees'] = connection_degrees.map((value) => Number(value));
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body,
    });
    return response.body;
  },
});
