import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieContactUpdateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_contact_update',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates fields on an existing Moxie contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Moxie contact by id: only the fields you pass change, Clear Fields blanks text fields, and Client ID moves the contact to another client. Use after finding the contact id with Search Contacts. Idempotent: repeating the same update leaves the contact unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.contact,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Id of the contact to update, from Search Contacts.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.contactUpdate, audience: 'ai' }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Moves the contact to this client id, from Search Clients. Leave empty to keep the current client.',
      required: false,
    }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.contactUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateContact({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
