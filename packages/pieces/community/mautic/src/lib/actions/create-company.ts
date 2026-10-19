import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { createMauticCompanyOutputSchema } from '../output-schemas';

export const createCompanyAction = createAction({
  auth: mauticAuth,
  description: 'Creates a new company in Mautic CRM',
  audience: 'human',
  aiMetadata: {
    description:
      'Create a new company in Mautic from the provided field values (company name, address, custom fields, etc.). Use when adding an organization to Mautic; to modify an existing company use Update Company, and check Search Company first to avoid duplicates. Not idempotent: each call inserts a new company record.',
    idempotent: false,
  },
  displayName: 'Create Company',
  name: 'create_mautic_company',
  outputSchema: createMauticCompanyOutputSchema,
  classification: 'WRITE',
  props: {
    fields: mauticProps.companyFields({ required: true }),
  },
  run: async function (context) {
    return await mauticApi.createCompany({ auth: context.auth, fields: context.propsValue.fields });
  },
});
