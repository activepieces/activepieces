import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const deleteLead = createAction({
  auth: famulorAuth,
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: 'Permanently delete a lead and abort any ongoing calls.',
  audience: 'both',
  aiMetadata: { description: 'Permanently remove a lead by its ID, aborting any call currently in progress for it. Pick when a lead should be dropped from a campaign entirely; this is destructive and irreversible. Not idempotent in effect — once deleted, a subsequent call targeting the same ID will fail to find it.', idempotent: false },
  props: famulorCommon.deleteLeadProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.deleteLeadSchema);

    return await famulorCommon.deleteLead({
      auth: auth.secret_text,
      lead_id: propsValue.lead_id,
    });
  },
});