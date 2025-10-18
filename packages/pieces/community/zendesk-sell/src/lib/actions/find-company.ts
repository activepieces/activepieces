import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Company } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompanyAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Finds a company',
  props: {
    companyId: Property.Number({
      displayName: 'Company ID',
      description: 'Specific company/organization ID to retrieve',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Search by company name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by company email',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Search by website URL',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'Filter by company owner',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.companyId) {
      const response = await makeZendeskSellRequest<{ data: Company }>(
        context.auth,
        HttpMethod.GET,
        `/organizations/${context.propsValue.companyId}`
      );

      return {
        success: true,
        company: response.data,
        count: 1,
      };
    }
    const params = new URLSearchParams();
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.email) params.append('email', context.propsValue.email);
    if (context.propsValue.website) params.append('website', context.propsValue.website);
    if (context.propsValue.ownerId) params.append('owner_id', context.propsValue.ownerId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await makeZendeskSellRequest<{ items: Company[] }>(
      context.auth,
      HttpMethod.GET,
      `/organizations${queryString}`
    );

    return {
      success: true,
      companies: response.items,
      count: response.items.length,
    };
  },
});
