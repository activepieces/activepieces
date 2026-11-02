import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getDeal = createAction({
  auth: ninjapipeAuth,
  name: 'get_deal',
  classification: 'READ',
  displayName: 'Get Deal',
  description: 'Gets one deal by ID.',
  audience: 'human',
  aiMetadata: { description: 'Fetch a single NinjaPipe deal by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    dealId: ninjapipeProps.dealRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.dealId, field: 'Deal' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/deals/${id}`, operation: 'get deal' });
  },
});
