import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCompany = createAction({
  auth: copperAuth,
  name: 'copper_search_company',
  displayName: 'Search Company',
  description: 'Search for companies in Copper',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Company name or other identifier to search for',
      required: false,
    }),
    email_domain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'Search by email domain',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { search_term, email_domain, limit } = context.propsValue;

    const body: any = {
      page_size: limit || 20,
    };

    if (search_term) {
      body.name = search_term;
    }

    if (email_domain) {
      body.email_domain = email_domain;
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/companies/search',
      body,
    });

    return response;
  },
});
