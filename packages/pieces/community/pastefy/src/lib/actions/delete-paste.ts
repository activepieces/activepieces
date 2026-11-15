import { createAction } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../common/ai-props';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_paste',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Paste',
  description: 'Deletes a paste. Returns deleted: false when it was already gone.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a paste you own by its ID. Returns {deleted: true, id}; if the paste does not exist (already deleted) it returns {deleted: false, id} instead of failing, so repeat calls are safe and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    paste_id: pastefyAiProps.pasteId(),
  },
  outputSchema: pastefyOutputSchemas.deleted,
  async run({ auth, propsValue }) {
    return pastefyRequests.deleteItem({ auth, kind: 'paste', id: propsValue.paste_id, missingIsOk: true });
  },
});
