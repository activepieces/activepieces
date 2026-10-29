import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateContactAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update details of an existing contact. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on a Moxie contact picked from a list; only filled fields change. For agents use moxie_contact_update. Idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.contact,
  props: {
    contactId: moxieDropdowns.contactId({ required: true }),
    ...moxieProps.fromSpecs({ specs: moxieFields.contactUpdate, audience: 'human' }),
    clientId: moxieDropdowns.clientId({
      required: false,
      displayName: 'Move to Client',
      description: 'Moves the contact to this client. Leave empty to keep the current client.',
    }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.contactUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateContact({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
