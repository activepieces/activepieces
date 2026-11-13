import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { updateCompanyOutputSchema } from '../output-schemas';

export const updateCompanyAction = createAction({
  auth: twentyAuth,
  name: 'update_company',
  outputSchema: updateCompanyOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Company',
  description: 'Updates an existing company record in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Updates an existing company in Twenty CRM, identified by the required company ID (resolve it first with Find Company). Patches only the supplied name, domain, address, and/or employee count; if no fields are given it simply returns the current record. Idempotent: targets a fixed ID and re-applying the same field values leaves the record unchanged.', idempotent: true },
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to update. Use the "Find Company" action to look this up.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
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
    const { companyId, name, domainName, address, employees } =
      context.propsValue;

    return await twentyApi.updateCompany({
      auth: context.auth,
      companyId,
      name,
      domainName,
      address,
      employees,
    });
  },
});
