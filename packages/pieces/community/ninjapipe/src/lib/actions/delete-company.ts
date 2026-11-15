import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteCompany = createAction({
  auth: ninjapipeAuth,
  name: 'delete_company',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Company',
  description: 'Permanently deletes a company.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe company by ID (companyId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the company is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    companyId: ninjapipeProps.companyRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.companyId, field: 'Company' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/companies/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete company',
    });
  },
});
