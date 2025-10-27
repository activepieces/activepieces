import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompanyAction = createAction({
  auth: folkAuth,
  name: 'find_company',
  displayName: 'Find a Company',
  description: 'Finds a company by matching its name or one of its emails',
  props: {
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
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Search by company domain',
      required: false,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Filter by specific group',
      required: false,
    }),
  },
  async run(context) {
    try {
      const queryParams: Record<string, string> = {
        type: 'company',
      };

      if (context.propsValue.name) {
        queryParams['name'] = context.propsValue.name;
      }
      if (context.propsValue.email) {
        queryParams['email'] = context.propsValue.email;
      }
      if (context.propsValue.domain) {
        queryParams['domain'] = context.propsValue.domain;
      }
      if (context.propsValue.groupId) {
        queryParams['group_id'] = context.propsValue.groupId;
      }

      const response = await makeFolkRequest<{ contacts: FolkCompany[]; meta: { total: number } }>(
        context.auth,
        HttpMethod.GET,
        '/companies/',
        undefined,
        queryParams
      );

      return {
        success: true,
        companies: response.contacts,
        count: response.contacts.length,
        total: response.meta?.total || response.contacts.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to find company',
        companies: [],
        count: 0,
      };
    }
  },
});