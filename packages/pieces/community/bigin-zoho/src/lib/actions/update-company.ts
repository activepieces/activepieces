import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginCompany } from '../common';

export const updateCompany = createAction({
  auth: biginZohoAuth,
  name: 'bigin_update_company',
  displayName: 'Update Company',
  description: 'Updates an existing company/account in Bigin',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company/account to update',
      required: true,
    }),
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'The name of the company/account',
      required: false,
    }),
    accountType: Property.StaticDropdown({
      displayName: 'Account Type',
      required: false,
      options: {
        options: [
          { label: 'Analyst', value: 'Analyst' },
          { label: 'Competitor', value: 'Competitor' },
          { label: 'Customer', value: 'Customer' },
          { label: 'Integrator', value: 'Integrator' },
          { label: 'Investor', value: 'Investor' },
          { label: 'Partner', value: 'Partner' },
          { label: 'Press', value: 'Press' },
          { label: 'Prospect', value: 'Prospect' },
          { label: 'Reseller', value: 'Reseller' },
          { label: 'Other', value: 'Other' },
        ],
      },
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
    }),
    annualRevenue: Property.Number({
      displayName: 'Annual Revenue',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    fax: Property.ShortText({
      displayName: 'Fax',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    billingStreet: Property.ShortText({
      displayName: 'Billing Street',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    billingState: Property.ShortText({
      displayName: 'Billing State',
      required: false,
    }),
    billingCode: Property.ShortText({
      displayName: 'Billing Code',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Country',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      accountName,
      accountType,
      industry,
      annualRevenue,
      phone,
      fax,
      website,
      billingStreet,
      billingCity,
      billingState,
      billingCode,
      billingCountry,
      description,
    } = context.propsValue;

    const companyData: Partial<BiginCompany> = {};

    // Add only provided fields for partial update
    if (accountName) companyData.Account_Name = accountName;
    if (accountType) companyData.Account_Type = accountType;
    if (industry) companyData.Industry = industry;
    if (annualRevenue) companyData.Annual_Revenue = annualRevenue;
    if (phone) companyData.Phone = phone;
    if (fax) companyData.Fax = fax;
    if (website) companyData.Website = website;
    if (billingStreet) companyData.Billing_Street = billingStreet;
    if (billingCity) companyData.Billing_City = billingCity;
    if (billingState) companyData.Billing_State = billingState;
    if (billingCode) companyData.Billing_Code = billingCode;
    if (billingCountry) companyData.Billing_Country = billingCountry;
    if (description) companyData.Description = description;

    const requestBody = {
      data: [companyData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.PUT,
      `/Accounts/${companyId}`,
      requestBody
    );

    return response;
  },
}); 