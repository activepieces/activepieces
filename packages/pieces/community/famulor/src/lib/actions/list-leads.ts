import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const listLeads = createAction({
  auth: famulorAuth,
  name: 'listLeads',
  displayName: 'List Leads',
  description:
    'List all leads for the authenticated user, including campaign info and secondary contacts.',
  props: famulorCommon.listLeadsProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.listLeadsSchema);

    return await famulorCommon.listLeads({
      auth: auth.secret_text,
    });
  },
});
