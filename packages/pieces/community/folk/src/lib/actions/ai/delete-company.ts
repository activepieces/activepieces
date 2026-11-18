import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const deleteCompany = createAction({
  auth: folkAuth,
  name: 'delete_company',
  displayName: 'Delete Company',
  description: 'Delete a company from Folk.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: folkOutputSchemas.deletedCompany,
  aiMetadata: {
    description:
      'Permanently deletes one Folk company by ID (com_...). Cannot be undone; confirm the ID with Get Company first. A second call for the same ID fails with not found.',
    idempotent: false,
  },
  props: {
    companyId: folkAi.idProp({ displayName: 'Company ID', description: 'ID of the company to delete (com_...).' }),
  },
  async run(context) {
    const id = folkClient.idSegment({ value: context.propsValue.companyId, label: 'Company ID' });
    return folkAi.deleteRecord({ auth: context.auth, path: `/v1/companies/${id}`, id });
  },
});
