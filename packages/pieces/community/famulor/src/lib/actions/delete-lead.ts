import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const deleteLead = createAction({
  auth: famulorAuth,
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: '⚠️ Permanently delete a lead from the system. This action cannot be undone and will abort any ongoing calls.',
  props: famulorCommon.deleteLeadProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.deleteLeadSchema);

    return await famulorCommon.deleteLead({
      auth: auth as string,
      lead_id: propsValue.lead_id as number,
    });
  },
});