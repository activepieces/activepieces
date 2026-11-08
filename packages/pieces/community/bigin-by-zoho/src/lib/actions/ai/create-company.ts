import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginCreateCompanyAi = createAction({
  auth: biginAuth,
  name: 'bigin_create_company',
  classification: 'WRITE',
  displayName: 'Create Company (Agent)',
  description: 'Create a new company in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Creates a new company (Accounts record) in Bigin. Company Name is required. Not idempotent: each call creates a new company, so search first to avoid duplicates. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    accountName: biginAiProps.text({ displayName: 'Company Name', description: 'Name of the company.', required: true }),
    phone: biginAiProps.text({ displayName: 'Phone', description: 'Phone number.', required: false }),
    website: biginAiProps.text({ displayName: 'Website', description: 'Website URL.', required: false }),
    billingStreet: biginAiProps.text({ displayName: 'Billing Street', description: 'Street address.', required: false }),
    billingCity: biginAiProps.text({ displayName: 'Billing City', description: 'City.', required: false }),
    billingState: biginAiProps.text({ displayName: 'Billing State', description: 'State or province.', required: false }),
    billingCountry: biginAiProps.text({ displayName: 'Billing Country', description: 'Country.', required: false }),
    billingCode: biginAiProps.text({ displayName: 'Billing Code', description: 'ZIP or postal code.', required: false }),
    ownerId: biginAiProps.ownerId(),
    tags: biginAiProps.tags(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Notes about the company.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;

    const record = biginRecords.mergeAdditionalFields({
      record: {
      Account_Name: propsValue.accountName ?? undefined,
      Phone: propsValue.phone ?? undefined,
      Website: propsValue.website ?? undefined,
      Billing_Street: propsValue.billingStreet ?? undefined,
      Billing_City: propsValue.billingCity ?? undefined,
      Billing_State: propsValue.billingState ?? undefined,
      Billing_Country: propsValue.billingCountry ?? undefined,
      Billing_Code: propsValue.billingCode ?? undefined,
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Tag: biginRecords.toTagList(propsValue.tags),
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Accounts', record });
  },
});
