import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchPerson = createAction({
  auth: copperAuth,
  name: 'copper_search_person',
  displayName: 'Search Person',
  description: 'Search for people in Copper',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Name, email, or other identifier to search for',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by specific email address',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Search by company name',
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
    const { search_term, email, company_name, limit } = context.propsValue;

    const body: any = {
      page_size: limit || 20,
    };

    // Build search criteria
    if (search_term) {
      body.name = search_term;
    }

    if (email) {
      body.emails = [{
        email: email,
        category: 'work'
      }];
    }

    if (company_name) {
      body.company_name = company_name;
    }

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/people/search',
      body,
    });

    return response;
  },
});
