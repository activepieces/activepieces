import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest } from '../common';

export const updateCompany = createAction({
  auth: twentyAuth,
  name: 'update_company',
  displayName: 'Update Company',
  description: 'Updates an existing company record in Twenty CRM.',
  audience: 'both',
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

    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (domainName) body['domainName'] = { primaryLinkUrl: domainName, primaryLinkLabel: '' };
    if (address) body['address'] = { addressStreet1: address };
    if (employees != null) body['employees'] = employees;

    if (Object.keys(body).length === 0) {
      return await twentyRequest(
        context.auth,
        HttpMethod.GET,
        `/rest/companies/${companyId}`,
      );
    }

    return await twentyRequest(
      context.auth,
      HttpMethod.PATCH,
      `/rest/companies/${companyId}`,
      body,
    );
  },
});
