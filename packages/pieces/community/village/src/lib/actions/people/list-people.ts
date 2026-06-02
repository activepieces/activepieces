import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listPeople = createAction({
  auth: villageAuth,
  name: 'list_people',
  displayName: 'List People',
  description:
    'Get your network contacts ranked by connection strength. Returns a paginated list with enrichment data, supporting cursor-based pagination and optional connection-degree filtering.',
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
      defaultValue: 25,
    }),
    connection_degrees: Property.Array({
      displayName: 'Connection Degrees',
      description:
        'Filter by connection degree (1=direct, 2=second-degree, 3=third-degree). Provide one or more values.',
      required: false,
    }),
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'Filter by current company domain (exact match), e.g. "google.com"',
      required: false,
    }),
  },
  async run(context) {
    const { cursor, limit, connection_degrees, company_domain } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (cursor !== undefined) body['cursor'] = cursor;
    if (limit !== undefined) body['limit'] = limit;
    if (connection_degrees !== undefined && Array.isArray(connection_degrees)) {
      body['connection_degrees'] = connection_degrees.map((value) => Number(value));
    }
    if (company_domain !== undefined) body['company_domain'] = company_domain;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
