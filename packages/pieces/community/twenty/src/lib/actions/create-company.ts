import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { createCompanyOutputSchema } from '../output-schemas';

export const createCompanyAction = createAction({
  auth: twentyAuth,
  name: 'create_company',
  outputSchema: createCompanyOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Company',
  description: 'Creates a new company record in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new company in Twenty CRM. Use when adding an organization to the CRM; company name is required, with optional domain, address, and employee count. Not idempotent: each call inserts a new record with no de-duplication, so repeated calls create duplicate companies.', idempotent: false },
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

    return await twentyApi.createCompany({
      auth: context.auth,
      name,
      domainName,
      address,
      employees,
    });
  },
});
