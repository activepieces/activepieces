import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';

export const createCompany = createAction({
  auth: biginAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Creates a Company Record',
  props: {
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
    tag: tagsDropdown('Accounts'),
    description: Property.ShortText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the company',
      required: false,
    }),
    owner: usersDropdown,
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
    try {
      const fieldsMap: Record<string, string> = {
        accountName: 'Account_Name',
        owner: 'Owner',
        phone: 'Phone',
        website: 'Website',
        tag: 'Tag',
        description: 'Description',
        billingStreet: 'Billing_Street',
        billingCity: 'Billing_City',
        billingState: 'Billing_State',
        billingCountry: 'Billing_Country',
        billingCode: 'Billing_Code',
      };

      const body = Object.entries(fieldsMap).reduce(
        (acc, [propKey, otherKey]) => {
          const value =
            context.propsValue[propKey as keyof typeof context.propsValue];
          if (value !== undefined && value !== null && value !== '') {
            acc[otherKey] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      const response = await biginApiService.createCompany(
        context.auth.access_token,
        (context.auth as any).api_domain,
        { data: [body] }
      );

      return {
        message: 'Company created successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error creating company:', error);
      throw new Error(error);
    }
  },
});
