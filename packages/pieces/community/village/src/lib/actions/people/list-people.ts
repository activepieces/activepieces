import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listPeople = createAction({
  auth: villageAuth,
  name: 'list_people',
  classification: 'SEARCH',
  displayName: 'List People',
  description:
    'Get your network contacts ranked by connection strength. Returns a paginated list with enrichment data, supporting cursor-based pagination and optional connection-degree filtering. Free with Connection Degrees = 1 only; without a Connection Degrees filter a call costs 1 Village credit, and other degrees cost 2 credits per 10 results.',
  audience: 'human',
  aiMetadata: {
    description:
      'Read-only browse of your own network contacts ranked by connection strength, with optional filtering by connection degree or current company domain. Use to enumerate who you already know; for criteria-based discovery beyond your contacts use Search People. Free with connection_degrees [1]; a call without a connection_degrees filter costs 1 credit, other degrees cost credits too. Cursor-paginated and safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listPeople,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people`,
      body,
    });
    return response;
  },
});
