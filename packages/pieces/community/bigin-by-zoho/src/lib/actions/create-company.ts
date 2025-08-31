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
    description: Property.LongText({
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
      const {
        accountName,
        owner,
        phone,
        website,
        tag,
        description,
        billingStreet,
        billingCity,
        billingState,
        billingCountry,
        billingCode,
      } = context.propsValue as any;

      const record: Record<string, any> = {
        Account_Name: accountName,
        Phone: phone,
        Website: website,
        Description: description,
        Billing_Street: billingStreet,
        Billing_City: billingCity,
        Billing_State: billingState,
        Billing_Country: billingCountry,
        Billing_Code: billingCode,
        Owner: owner ? { id: owner } : undefined,
        Tag: Array.isArray(tag) && tag.length > 0 ? tag.map((t: string) => ({ name: t })) : undefined,
      };

      Object.keys(record).forEach((k) => {
        const v = (record as any)[k];
        if (
          v === undefined ||
          v === null ||
          (typeof v === 'string' && v.trim() === '') ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete (record as any)[k];
        }
      });

      const response = await biginApiService.createCompany(
        context.auth.access_token,
        (context.auth as any).api_domain,
        { data: [record] }
      );

      return {
        message: 'Company created successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error creating company:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create company: ${error.message}`
          : 'Failed to create company due to an unknown error'
      );
    }
  },
});
