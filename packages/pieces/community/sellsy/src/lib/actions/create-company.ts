import { createAction, Property } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCompany = createAction({
  auth: sellsyAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Create a new company in Sellsy',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Company Type',
      description: 'Type of company',
      required: true,
      options: {
        options: [
          { label: 'Prospect', value: 'prospect' },
          { label: 'Client', value: 'client' },
          { label: 'Supplier', value: 'supplier' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email address',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Company phone number',
      required: false,
    }),
    mobile_number: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Company mobile number',
      required: false,
    }),
    fax_number: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Company fax number',
      required: false,
    }),
    capital: Property.ShortText({
      displayName: 'Capital',
      description: 'Company capital',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Company reference (max 100 characters)',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note about the company',
      required: false,
    }),
    auxiliary_code: Property.ShortText({
      displayName: 'Auxiliary Code',
      description: 'Company auxiliary code',
      required: false,
    }),
    rate_category_id: Property.Number({
      displayName: 'Rate Category ID',
      description: 'Company rate category ID',
      required: false,
    }),
    accounting_code_id: Property.Number({
      displayName: 'Accounting Code ID',
      description: 'Company accounting code ID',
      required: false,
    }),
    accounting_purchase_code_id: Property.Number({
      displayName: 'Accounting Purchase Code ID',
      description: 'Company accounting purchase code ID',
      required: false,
    }),
    owner_id: Property.Number({
      displayName: 'Owner ID',
      description: 'Owner of the company (Staff ID)',
      required: false,
    }),
    is_archived: Property.Checkbox({
      displayName: 'Is Archived',
      description: 'Archive status of the company',
      required: false,
      defaultValue: false,
    }),
    business_segment: Property.Number({
      displayName: 'Business Segment',
      description: 'Company business segment ID',
      required: false,
    }),
    number_of_employees: Property.Number({
      displayName: 'Number of Employees',
      description: 'Number of employees in the company',
      required: false,
    }),
    marketing_campaigns_subscriptions: Property.StaticMultiSelectDropdown({
      displayName: 'Marketing Subscriptions',
      description: 'List of marketing campaign types subscribed',
      required: false,
      options: {
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'Phone', value: 'phone' },
          { label: 'Email', value: 'email' },
          { label: 'Postal Mail', value: 'postal_mail' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    verify: Property.Checkbox({
      displayName: 'Verify Only',
      description: 'Set to true to validate payload without persisting data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const companyData: any = {
      type: propsValue.type,
      name: propsValue.name,
    };

    // Add optional fields if provided
    if (propsValue.email) companyData.email = propsValue.email;
    if (propsValue.website) companyData.website = propsValue.website;
    if (propsValue.phone_number) companyData.phone_number = propsValue.phone_number;
    if (propsValue.mobile_number) companyData.mobile_number = propsValue.mobile_number;
    if (propsValue.fax_number) companyData.fax_number = propsValue.fax_number;
    if (propsValue.capital) companyData.capital = propsValue.capital;
    if (propsValue.reference) companyData.reference = propsValue.reference;
    if (propsValue.note) companyData.note = propsValue.note;
    if (propsValue.auxiliary_code) companyData.auxiliary_code = propsValue.auxiliary_code;
    if (propsValue.rate_category_id) companyData.rate_category_id = propsValue.rate_category_id;
    if (propsValue.accounting_code_id) companyData.accounting_code_id = propsValue.accounting_code_id;
    if (propsValue.accounting_purchase_code_id) companyData.accounting_purchase_code_id = propsValue.accounting_purchase_code_id;
    if (propsValue.owner_id) companyData.owner_id = propsValue.owner_id;
    if (propsValue.is_archived !== undefined) companyData.is_archived = propsValue.is_archived;
    if (propsValue.business_segment) companyData.business_segment = propsValue.business_segment;
    if (propsValue.number_of_employees) companyData.number_of_employees = propsValue.number_of_employees;
    if (propsValue.marketing_campaigns_subscriptions) {
      companyData.marketing_campaigns_subscriptions = propsValue.marketing_campaigns_subscriptions;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (propsValue.verify) {
      queryParams.append('verify', 'true');
    }

    const queryString = queryParams.toString();
    const path = `/companies${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      path,
      companyData
    );

    return response;
  },
});