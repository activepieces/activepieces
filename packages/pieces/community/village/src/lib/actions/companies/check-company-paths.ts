import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const checkCompanyPaths = createAction({
  auth: villageAuth,
  name: 'check_company_paths',
  displayName: 'Check Company Paths',
  description:
    'Quickly check if you have connections to a company without fetching full details. Returns whether paths exist, an overall score, count of reachable people, and avatar thumbnails.',
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
  },
  async run(context) {
    const { domain, linkedin_url, url } = context.propsValue;

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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/paths/check`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: identifier,
    });
    return response.body;
  },
});
