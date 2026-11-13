import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateClientAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_client',
  classification: 'WRITE',
  displayName: 'Update Client',
  description: 'Update details of an existing client. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on a Moxie client picked from a list; only filled fields change. For agents use moxie_client_update, which takes the client id directly. Idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.client,
  props: {
    clientId: moxieDropdowns.clientId({ required: true }),
    ...moxieProps.fromSpecs({ specs: moxieFields.clientUpdate, audience: 'human' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.clientUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateClient({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
