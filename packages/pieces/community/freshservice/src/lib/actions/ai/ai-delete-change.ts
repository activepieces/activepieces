import { createAction, Property } from '@activepieces/pieces-framework';
import { freshserviceAuth } from '../../../';
import { freshserviceDelete } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiDeleteChange = createAction({
  auth: freshserviceAuth,
  name: 'ai_delete_change',
  displayName: 'Delete Change (AI)',
  description: 'Deletes a Freshservice change request.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: freshserviceSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Freshservice change request by numeric change id (from List Changes). Cannot be undone. Not idempotent — a repeat call on an already-deleted change returns a 404 error.',
    idempotent: false,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
  },
  async run(context) {
    const { change_id } = context.propsValue;
    await freshserviceDelete({ auth: context.auth, endpoint: `changes/${change_id}`, resourceLabel: 'change' });
    return { success: true, id: change_id };
  },
});
