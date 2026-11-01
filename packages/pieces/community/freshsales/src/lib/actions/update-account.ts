import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { freshsalesRecords } from '../common/records';
import { accountOutputSchema } from '../output-schemas';

export const updateAccount = createAction({
  auth: freshsalesAuth,
  name: 'update_account',
  displayName: 'Update Account',
  description: 'Update fields of an existing account',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an existing Freshsales account by numeric ID. Only the fields you provide are changed. Returns the updated account. Idempotent: repeating the call with the same values gives the same result.',
    idempotent: true,
  },
  outputSchema: accountOutputSchema,
  props: {
    sales_account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account to update',
      placeholder: '16000123456',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the account',
      placeholder: 'Acme Inc',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website of the account',
      placeholder: 'https://acme.com',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the account',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Street address of the account',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City of the account',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State of the account',
      required: false,
    }),
    zipcode: Property.ShortText({
      displayName: 'Zip code',
      description: 'Zip code of the account',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country of the account',
      required: false,
    }),
    industry_type_id: freshsalesProps.industryType(),
    business_type_id: freshsalesProps.businessType(),
    number_of_employees: Property.Number({
      displayName: 'Number of Employees',
      description: 'Employee count',
      required: false,
    }),
    annual_revenue: Property.Number({
      displayName: 'Annual Revenue',
      description: 'Yearly revenue of the account',
      required: false,
    }),
    owner_id: freshsalesProps.owner({ required: false }),
    territory_id: freshsalesProps.territory(),
    parent_sales_account_id: Property.ShortText({
      displayName: 'Parent Account ID',
      description: 'ID of the parent account',
      placeholder: '16000123456',
      required: false,
    }),
    custom_fields: freshsalesProps.customFields(),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.sales_account_id, field: 'Account ID' });
    const salesAccount = freshsalesRecords.buildAccountBody({
      name: context.propsValue.name,
      website: context.propsValue.website,
      phone: context.propsValue.phone,
      address: context.propsValue.address,
      city: context.propsValue.city,
      state: context.propsValue.state,
      zipcode: context.propsValue.zipcode,
      country: context.propsValue.country,
      industry_type_id: context.propsValue.industry_type_id,
      business_type_id: context.propsValue.business_type_id,
      number_of_employees: context.propsValue.number_of_employees,
      annual_revenue: context.propsValue.annual_revenue,
      owner_id: context.propsValue.owner_id,
      territory_id: context.propsValue.territory_id,
      parent_sales_account_id: context.propsValue.parent_sales_account_id,
      custom_fields: context.propsValue.custom_fields,
    });
    if (Object.keys(salesAccount).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/sales_accounts/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.sales_accounts },
      body: { sales_account: salesAccount },
    });
    return freshsalesClient.unwrap({ body: response, key: 'sales_account' });
  },
});
