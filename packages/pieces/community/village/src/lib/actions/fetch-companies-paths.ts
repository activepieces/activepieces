import { createAction, Property } from '@activepieces/pieces-framework';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../..';

export const fetchCompaniesPaths = createAction({
  name: 'fetchCompaniesPaths',
  auth: villageAuth,
  displayName: 'Find Company Paths',
  description:
    'Enrich a company record with all people that have available intro paths',
  props: {
    user_identifier: Property.LongText({
      displayName: 'User Identifier',
      description: `If you're a Village Partner, use this field that identifies your user`,
      required: false,
    }),
    company_domain_url: Property.LongText({
      displayName: 'Company Domain URL',
      description: `The Company Domain URL of the company you're trying to find paths to. E.g. https://openai.com/`,
      required: false,
    }),
    company_linkedin_url: Property.LongText({
      displayName: 'Company Linkedin URL',
      description: `The Company Linkedin URL of the company you're trying to find paths to. E.g. https://www.linkedin.com/company/openai/`,
      required: false,
    }),
  },
  async run(context) {
    const { company_domain_url, company_linkedin_url, user_identifier } =
      context.propsValue;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/companies/paths',
      headers: {
        'X-Village-Secret-Key': context.auth, // Pass API key in headers
      },
      body: {
        user_identifier,
        company_domain_url,
        company_linkedin_url,
      },
    });
    return res.body;
  },
});
