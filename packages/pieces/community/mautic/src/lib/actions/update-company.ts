import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';
import { updateMauticCompanyOutputSchema } from '../output-schemas';

export const updateCompanyAction = createAction({
  auth: mauticAuth,
  description: 'Update a company in Mautic CRM',
  audience: 'human',
  aiMetadata: {
    description:
      'Update an existing Mautic company, identified by its numeric company id, with the provided field values (empty fields are dropped so they are left unchanged). Use when you already know the company id (resolve it first with Search Company if you only have a name). Idempotent: applying the same field values to the same id repeatedly leaves the company in the same state.',
    idempotent: true,
  },
  displayName: 'Update Company With Contact Id',
  name: 'update_mautic_company',
  outputSchema: updateMauticCompanyOutputSchema,
  classification: 'WRITE',
  props: {
    id: mauticProps.entityId({ required: true }),
    fields: mauticProps.companyFields({ required: true }),
  },
  run: async function (context) {
    return await mauticApi.updateCompany({
      auth: context.auth,
      id: context.propsValue.id,
      fields: context.propsValue.fields,
    });
  },
});
