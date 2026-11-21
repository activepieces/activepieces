import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getCompanyPaths = createAction({
  auth: villageAuth,
  name: 'get_company_paths',
  classification: 'SEARCH',
  displayName: 'Get Company Paths',
  description:
    'Find introduction paths to people at a specific company. Returns up to 50 employees you can reach through your network, ranked by connection strength.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only lookup of the reachable employees at one company (identified by domain, LinkedIn URL, or generic url; supply exactly one), ranked by connection strength. Use when you want the actual people to approach; for a cheaper exists/score screen first use Check Company Paths. Costs 2 credits per page of up to 50 people and needs a balance of at least 2. Cursor-paginated.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getCompanyPaths,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Company domain, e.g. "acme.com" (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        'LinkedIn company page URL, e.g. "https://linkedin.com/company/acme-corp" (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'Generic company URL (auto-detected) (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Opaque cursor for pagination (from previous response)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results per page (default 25, max 50)',
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
    const { domain, linkedin_url, url, cursor, limit, connection_degrees } = context.propsValue;

    const provided = [domain, linkedin_url, url].filter((value) => value !== undefined && value !== '');
    if (provided.length === 0) {
      throw new Error('Provide one of: domain, linkedin_url, url');
    }
    if (provided.length > 1) {
      throw new Error('Provide only one of: domain, linkedin_url, url');
    }

    const identifier: Record<string, string> = domain
      ? { domain }
      : linkedin_url
        ? { linkedin_url }
        : { url: url ?? '' };

    const body: Record<string, unknown> = { ...identifier };
    if (cursor !== undefined) body['cursor'] = cursor;
    if (limit !== undefined) body['limit'] = limit;
    if (connection_degrees !== undefined && Array.isArray(connection_degrees)) {
      body['connection_degrees'] = connection_degrees.map((value) => Number(value));
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/companies/paths`,
      body,
    });
    return response;
  },
});
