import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const getCompanyPaths = createAction({
  auth: villageAuth,
  name: 'get_company_paths',
  displayName: 'Get Company Paths',
  description:
    'Find introduction paths to people at a specific company. Returns up to 50 employees you can reach through your network, ranked by connection strength.',
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
        : { url: url as string };

    const body: Record<string, unknown> = { ...identifier };
    if (cursor !== undefined) body['cursor'] = cursor;
    if (limit !== undefined) body['limit'] = limit;
    if (connection_degrees !== undefined && Array.isArray(connection_degrees)) {
      body['connection_degrees'] = connection_degrees.map((value) => Number(value));
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/paths`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
