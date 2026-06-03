import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_COMPANIES = 100;

export const sortCompanies = createAction({
  auth: villageAuth,
  name: 'sort_companies',
  displayName: 'Sort Companies',
  description:
    'Rank a list of companies (up to 100 LinkedIn URLs or domains) by how well-connected you are to people there. Each result includes a score, label, LinkedIn URL, and domain.',
  props: {
    companies: Property.Array({
      displayName: 'Companies',
      description:
        'Array of company URLs (LinkedIn URLs or domains), e.g. "https://linkedin.com/company/acme-corp" or "example.com". Max 100.',
      required: true,
    }),
  },
  async run(context) {
    const { companies } = context.propsValue;

    if (!Array.isArray(companies) || companies.length === 0) {
      throw new Error('At least one company URL is required');
    }
    if (companies.length > MAX_COMPANIES) {
      throw new Error(`Maximum ${MAX_COMPANIES} companies per request`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/sort`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: {
        companies: companies.map((value) => String(value)),
      },
    });
    return response.body;
  },
});
