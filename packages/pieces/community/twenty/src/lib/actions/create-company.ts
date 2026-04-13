import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest } from '../common';

export const createCompany = createAction({
  auth: twentyAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company record in Twenty CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      required: true,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The company website domain (e.g. acme.com).',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      required: false,
    }),
    employees: Property.Number({
      displayName: 'Number of Employees',
      required: false,
    }),
  },
  async run(context) {
    const { name, domainName, address, employees } = context.propsValue;

    return await twentyRequest(
      context.auth,
      HttpMethod.POST,
      '/rest/companies',
      {
        name,
        domainName: domainName ? { primaryLinkUrl: domainName, primaryLinkLabel: '' } : undefined,
        address: address ? { addressStreet1: address } : undefined,
        employees: employees ?? undefined,
      },
    );
  },
});
