import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieContactCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_contact_create',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a contact in Moxie, optionally under a client.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a contact person in Moxie, attached to a client when Client Name is given (exact name, from Search Clients). Use to add a person to an account or a named lead; check Search Contacts first to avoid duplicates. Not idempotent: each call creates a separate contact, even with the same email.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.contact,
  props: {
    ...moxieProps.fromSpecs({ specs: moxieFields.contactCreate, audience: 'ai' }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of the client to attach the contact to, from Search Clients. Leave empty for a contact without a client.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createContact({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
