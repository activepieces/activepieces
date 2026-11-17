import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listCompanies = createAction({
  auth: villageAuth,
  name: 'list_companies',
  classification: 'SEARCH',
  displayName: 'List Companies',
  description:
    'Get your top-connected companies ranked by network strength. Returns a paginated list with connection score, label, LinkedIn URL, domain, and enrichment data. Free with Connection Degrees = 1 only; without a Connection Degrees filter a call costs 1 Village credit, and other degrees cost 2 credits per 10 results.',
  audience: 'human',
  aiMetadata: {
    description:
      'Read-only browse of the companies your network reaches best, ranked by connection strength, with optional connection-degree filtering. Use to enumerate companies you already have a path into; for criteria-based discovery use Search Companies. Free with connection_degrees [1]; a call without a connection_degrees filter costs 1 credit, other degrees cost credits too. Cursor-paginated and safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listCompanies,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/companies`,
      body,
    });
    return response;
  },
});
