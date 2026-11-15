import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieClientUpdateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_client_update',
  classification: 'WRITE',
  displayName: 'Update Client',
  description: 'Updates fields on an existing Moxie client.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Moxie client by id: only the fields you pass change, and Clear Fields blanks text fields. Use to correct address, billing, rate or archive state once you have the client id from Search Clients or List Clients. Idempotent: repeating the same update leaves the client unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.client,
  props: {
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Id of the client to update, from Search Clients, List Clients or a client trigger.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.clientUpdate, audience: 'ai' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.clientUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateClient({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
