import { biginAuth } from '../../index';
import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { handleDropdownError } from '../common/helpers';

export const updateCompany = createAction({
  auth: biginAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description:
    'Updates an existing Company and prepopulates its fields for editing.',
  props: {
    companyId: Property.Dropdown({
      displayName: 'Select Company',
      description: 'Choose a company to update',
      required: true,
      refreshers: ['auth'],
      options: async (context: any) => {
        if (!context.auth)
          return handleDropdownError('Please connect your account first');

        const response = await biginApiService.fetchCompanies(
          context.auth.access_token,
          (context.auth as any).api_domain
        );

        return {
          options: response.data.map((company: any) => ({
            label: company.Account_Name,
            value: JSON.stringify(company),
          })),
        };
      },
    }),
    owner: usersDropdown,
    companyDetails: Property.DynamicProperties({
      displayName: 'Company Details',
      description: 'These fields will be prepopulated with company data',
      refreshers: ['companyId', 'auth'],
      required: true,
      props: async (propsValue: any): Promise<InputPropertyMap> => {
        if (!propsValue.companyId) return {};

        const company = JSON.parse(propsValue.companyId);

        return {
          accountName: Property.ShortText({
            displayName: 'Account Name',
            required: false,
            defaultValue: company.Account_Name,
          }),
          phone: Property.ShortText({
            displayName: 'Phone',
            defaultValue: company.Phone,
            required: false,
          }),
          website: Property.ShortText({
            displayName: 'Website',
            defaultValue: company.Website,
            required: false,
          }),
          description: Property.ShortText({
            displayName: 'Description',
            defaultValue: company.Description,
            required: false,
          }),
          billingStreet: Property.ShortText({
            displayName: 'Billing Street',
            defaultValue: company.Billing_Street,
            required: false,
          }),
          billingCity: Property.ShortText({
            displayName: 'Billing City',
            defaultValue: company.Billing_City,
            required: false,
          }),
          billingState: Property.ShortText({
            displayName: 'Billing State',
            defaultValue: company.Billing_State,
            required: false,
          }),
          billingCountry: Property.ShortText({
            displayName: 'Billing Country',
            defaultValue: company.Billing_Country,
            required: false,
          }),
          billingCode: Property.ShortText({
            displayName: 'Billing Code',
            defaultValue: company.Billing_Code,
            required: false,
          }),
        };
      },
    }),
    tag: tagsDropdown('Accounts'),
  },

  async run(context) {
    try {
      const company = JSON.parse(context.propsValue.companyId);
      const companyId = company.id;
      const updates = context.propsValue.companyDetails;

      const body: Record<string, any> = {
        Account_Name: updates['accountName'],
        Phone: updates['phone'],
        Website: updates['website'],
        Tag: updates['tag']?.length
          ? updates['tag'].map((t: string) => ({ name: t }))
          : undefined,
        Description: updates['description'],
        Owner: updates['owner'] ? { id: updates['owner'] } : undefined,
        Billing_Street: updates['billingStreet'],
        Billing_City: updates['billingCity'],
        Billing_State: updates['billingState'],
        Billing_Country: updates['billingCountry'],
        Billing_Code: updates['billingCode'],
        id: companyId,
      };

      Object.keys(body).forEach((key) => {
        if (
          body[key] === undefined ||
          body[key] === null ||
          (typeof body[key] === 'string' && body[key].trim() === '')
        ) {
          delete body[key];
        }
      });

      const response = await biginApiService.updateCompany(
        context.auth.access_token,
        (context.auth as any).api_domain,
        { data: [body] }
      );

      return {
        message: 'Company updated successfully',
        data: response.data[0],
      };
    } catch (error: any) {
      console.error('Error updating company:', error);
      throw new Error(error);
    }
  },
});
