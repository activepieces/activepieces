import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getCompany = createAction({
  auth: ninjapipeAuth,
  name: 'get_company',
  classification: 'READ',
  displayName: 'Get Company',
  description: 'Gets one company by ID.',
  audience: 'human',
  aiMetadata: { description: 'Fetch a single NinjaPipe company by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.company,
  props: {
    companyId: ninjapipeProps.companyRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.companyId, field: 'Company' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/companies/${id}`, operation: 'get company' });
  },
});
