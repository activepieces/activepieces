import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, validateRequiredFields, cleanupData } from '../common/utils';

export const createCompanyAction = createAction({
  auth: biginAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Create a new company in Bigin CRM',
  props: {
    accountName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: true
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the company',
      required: false
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website URL of the company',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the company',
      required: false
    }),
    billingStreet: Property.ShortText({
      displayName: 'Billing Street',
      description: 'Street address for billing',
      required: false
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing City',
      description: 'City for billing',
      required: false
    }),
    billingState: Property.ShortText({
      displayName: 'Billing State',
      description: 'State or province for billing',
      required: false
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing Country',
      description: 'Country for billing',
      required: false
    }),
    billingCode: Property.ShortText({
      displayName: 'Billing ZIP/Postal Code',
      description: 'ZIP or postal code for billing',
      required: false
    })
  },
  async run(context) {
    const {
      accountName,
      phone,
      website,
      description,
      billingStreet,
      billingCity,
      billingState,
      billingCountry,
      billingCode
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Validate required fields
      validateRequiredFields({ accountName }, ['accountName']);

      // Build company data
      const companyData = cleanupData({
        [COMMON_FIELDS.COMPANY.ACCOUNT_NAME]: accountName,
        [COMMON_FIELDS.COMPANY.PHONE]: phone,
        [COMMON_FIELDS.COMPANY.WEBSITE]: website,
        [COMMON_FIELDS.COMPANY.DESCRIPTION]: description,
        [COMMON_FIELDS.COMPANY.BILLING_STREET]: billingStreet,
        [COMMON_FIELDS.COMPANY.BILLING_CITY]: billingCity,
        [COMMON_FIELDS.COMPANY.BILLING_STATE]: billingState,
        [COMMON_FIELDS.COMPANY.BILLING_COUNTRY]: billingCountry,
        [COMMON_FIELDS.COMPANY.BILLING_CODE]: billingCode
      });

      // Create company
      const response = await client.createCompany(companyData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Company created successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to create company: ${error.message}`);
    }
  }
});
