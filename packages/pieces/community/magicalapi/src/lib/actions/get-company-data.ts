import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { magicalApiAuth } from '../common/auth';
import { magicalApiCall } from '../common/client';

export const getCompanyData = createAction({
  auth: magicalApiAuth,
  name: 'get_company_data',
  displayName: 'Get Company Data',
  description: 'Given a company name or domain, fetch company info (size, industry, etc.).',
  props: {
    identifier_type: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'The type of identifier to use for company lookup',
      required: true,
      options: {
        options: [
          { label: 'Company Name', value: 'name' },
          { label: 'Domain', value: 'domain' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'Website URL', value: 'website' },
          { label: 'Stock Symbol', value: 'stock_symbol' },
        ],
      },
    }),
    identifier_value: Property.ShortText({
      displayName: 'Identifier Value',
      description: 'The actual value of the identifier (company name, domain, URL, etc.)',
      required: true,
    }),
    include_financials: Property.Checkbox({
      displayName: 'Include Financial Data',
      description: 'Include financial information like revenue, funding, etc.',
      required: false,
      defaultValue: true,
    }),
    include_employees: Property.Checkbox({
      displayName: 'Include Employee Information',
      description: 'Include employee count and growth data',
      required: false,
      defaultValue: true,
    }),
    include_technologies: Property.Checkbox({
      displayName: 'Include Technologies',
      description: 'Include technology stack and tools used by the company',
      required: false,
      defaultValue: false,
    }),
    include_social_profiles: Property.Checkbox({
      displayName: 'Include Social Profiles',
      description: 'Include social media profiles and presence',
      required: false,
      defaultValue: true,
    }),
    include_news: Property.Checkbox({
      displayName: 'Include Recent News',
      description: 'Include recent news and press releases',
      required: false,
      defaultValue: false,
    }),
    include_competitors: Property.Checkbox({
      displayName: 'Include Competitors',
      description: 'Include competitor analysis and similar companies',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth } = context;
    const {
      identifier_type,
      identifier_value,
      include_financials,
      include_employees,
      include_technologies,
      include_social_profiles,
      include_news,
      include_competitors,
    } = context.propsValue;

    const requestBody = {
      identifier_type,
      identifier_value,
      include_financials,
      include_employees,
      include_technologies,
      include_social_profiles,
      include_news,
      include_competitors,
    };

    const result = await magicalApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      endpoint: '/company/lookup',
      body: requestBody,
    });

    return result;
  },
});
