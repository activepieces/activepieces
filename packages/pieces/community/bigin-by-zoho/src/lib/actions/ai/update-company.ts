import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginUpdateCompanyAi = createAction({
  auth: biginAuth,
  name: 'bigin_update_company',
  classification: 'WRITE',
  displayName: 'Update Company (Agent)',
  description: 'Update an existing company in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiUpdateResult,
  aiMetadata: {
    description:
      'Updates an existing Bigin company by id. Only the fields you provide are changed. Tags are added to the existing tags of the record (it reads the record first), never replacing them. Idempotent: repeating the same update leaves the company in the same state. Returns the saved record.',
    idempotent: true,
  },
  props: {
    recordId: biginAiProps.id({ displayName: 'Company ID', description: 'Company (Accounts) id. Resolve it with Search Records (Agent) on Accounts.', required: true }),
    accountName: biginAiProps.text({ displayName: 'Company Name', description: 'Name of the company.', required: false }),
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
    const connection = getBiginConnection(context.auth);
    const id = propsValue.recordId.trim();
    const tags = await biginRecords.mergeTagsWithExisting({ connection, module: 'Accounts', id, tags: propsValue.tags });

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
      Tag: tags,
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return biginRecords.update({ connection, module: 'Accounts', id, record });
  },
});
