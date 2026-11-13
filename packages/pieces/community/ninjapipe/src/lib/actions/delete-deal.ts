import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteDeal = createAction({
  auth: ninjapipeAuth,
  name: 'delete_deal',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Deal',
  description: 'Permanently deletes a deal.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe deal by ID (dealId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the deal is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    dealId: ninjapipeProps.dealRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.dealId, field: 'Deal' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/deals/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete deal',
    });
  },
});
