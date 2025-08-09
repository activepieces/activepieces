import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { tagDropdown, userIdDropdown } from '../common/props';

export const createCompany = createAction({
  auth: biginAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Create a new company record in Bigin',
  props: {
    owner: userIdDropdown,
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'Provide the name of the company',
      required: true,
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
    tag: tagDropdown('Accounts'),
    description: Property.ShortText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the company',
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
      Account_Name: context.propsValue.accountName,
    };

    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.phone) body['Phone'] = context.propsValue.phone;
    if (context.propsValue.website)
      body['Website'] = context.propsValue.website;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;
    if (context.propsValue.description)
      body['Description'] = context.propsValue.description;
    if (context.propsValue.billingStreet)
      body['Billing_Street'] = context.propsValue.billingStreet;
    if (context.propsValue.billingCity)
      body['Billing_City'] = context.propsValue.billingCity;
    if (context.propsValue.billingState)
      body['Billing_State'] = context.propsValue.billingState;
    if (context.propsValue.billingCountry)
      body['Billing_Country'] = context.propsValue.billingCountry;
    if (context.propsValue.billingCode)
      body['Billing_Code'] = context.propsValue.billingCode;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Accounts',
      context.auth.props?.['location'] || 'com',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
