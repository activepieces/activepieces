import { createAction } from '@activepieces/pieces-framework';
import { freshserviceAuth } from '../../';
import { freshserviceDelete } from '../common/client';
import { freshserviceCommon } from '../common/props';
import { freshserviceSchemas } from '../common/schemas';

export const deleteChange = createAction({
  auth: freshserviceAuth,
  name: 'delete_change',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Change',
  description: 'Deletes a change request from Freshservice.',
  audience: 'human',
  outputSchema: freshserviceSchemas.deleted,
  aiMetadata: {
    description: 'Permanently deletes a change request from Freshservice, identified by change id. Use to remove a change that should no longer exist. Not idempotent — a repeat call on an already-deleted change returns a 404 error. Get change ids from List Changes.',
    idempotent: false,
  },
  props: {
    change_id: freshserviceCommon.change(true),
  },
  async run(context) {
    await freshserviceDelete({ auth: context.auth, endpoint: `changes/${context.propsValue.change_id}`, resourceLabel: 'change' });

    return { success: true, id: context.propsValue.change_id };
  },
});
