import { createAction, Property } from '@activepieces/pieces-framework';
import { nutshellAuth } from '../auth';
import { nutshellClient } from '../common/client';

const getCompanyAction = createAction({
  auth: nutshellAuth,
  name: 'get_company',
  displayName: 'Get Company',
  description: 'Retrieve a company by ID from Nutshell CRM',
  props: {
    accountId: Property.Number({
      displayName: 'Account ID',
      description: 'The ID of the company/account to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.getCompany(auth, propsValue.accountId);
  },
});

const createCompanyAction = createAction({
  auth: nutshellAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Create a new company in Nutshell CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: true,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'Industry of the company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'Company website',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const account: Record<string, unknown> = {
      name: propsValue.name,
    };
    if (propsValue.industry) account.industry = propsValue.industry;
    if (propsValue.phone) account.phone = propsValue.phone;
    if (propsValue.url) account.url = propsValue.url;
    return await nutshellClient.createCompany(auth, account);
  },
});

const updateCompanyAction = createAction({
  auth: nutshellAuth,
  name: 'update_company',
  displayName: 'Update Company',
  description: 'Update an existing company in Nutshell CRM',
  props: {
    accountId: Property.Number({
      displayName: 'Account ID',
      description: 'The ID of the company to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Updated name',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'Updated industry',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Updated phone',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const account: Record<string, unknown> = {};
    if (propsValue.name) account.name = propsValue.name;
    if (propsValue.industry) account.industry = propsValue.industry;
    if (propsValue.phone) account.phone = propsValue.phone;
    return await nutshellClient.updateCompany(auth, propsValue.accountId, account);
  },
});

const searchCompaniesAction = createAction({
  auth: nutshellAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Search for companies in Nutshell CRM',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find companies',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results (default 25)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.searchCompanies(auth, propsValue.query, propsValue.limit ?? 25);
  },
});

export { getCompanyAction, createCompanyAction, updateCompanyAction, searchCompaniesAction };
