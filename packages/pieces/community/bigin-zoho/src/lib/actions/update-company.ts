import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const updateCompany = createAction({
  auth: biginZohoAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Update an existing company record in Bigin',
  props: {
    recordId: Property.Dropdown({
      displayName: 'Company',
      description: 'Select the company to update',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Accounts',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const companies = response.data || [];
          return {
            disabled: false,
            options: companies.map((company: any) => ({
              label: company.Account_Name,
              value: company.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    owner: Property.Dropdown({
      displayName: 'Owner',
      description: 'Select the owner of the company',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/users',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const users = response.users || [];
          return {
            disabled: false,
            options: users.map((user: any) => ({
              label: user.full_name || `${user.first_name} ${user.last_name}`,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'Provide the name of the company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Provide a phone number for the company',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Provide a website URL for the company',
      required: false,
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description: 'Provide the list of tags that can be associated with the company',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Provide additional descriptions or notes related to the company',
      required: false,
    }),
    billingStreet: Property.ShortText({
      displayName: 'Billing Street',
      description: 'The street address of the company',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing City',
      description: 'The city where the company is located',
      required: false,
    }),
    billingState: Property.ShortText({
      displayName: 'Billing State',
      description: 'The state or province where the company is located',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Country',
      description: 'The country of the company',
      required: false,
    }),
    billingCode: Property.ShortText({
      displayName: 'Billing Code',
      description: 'The ZIP or postal code of the company',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.accountName) body['Account_Name'] = context.propsValue.accountName;
    if (context.propsValue.phone) body['Phone'] = context.propsValue.phone;
    if (context.propsValue.website) body['Website'] = context.propsValue.website;
    if (context.propsValue.tag && context.propsValue.tag.length > 0) {
      body['Tag'] = context.propsValue.tag.map((tag: unknown) => ({ name: tag as string }));
    }
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.billingStreet) body['Billing_Street'] = context.propsValue.billingStreet;
    if (context.propsValue.billingCity) body['Billing_City'] = context.propsValue.billingCity;
    if (context.propsValue.billingState) body['Billing_State'] = context.propsValue.billingState;
    if (context.propsValue.billingCountry) body['Billing_Country'] = context.propsValue.billingCountry;
    if (context.propsValue.billingCode) body['Billing_Code'] = context.propsValue.billingCode;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Accounts',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 