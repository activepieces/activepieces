import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieClientCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_client_create',
  classification: 'WRITE',
  displayName: 'Create Client',
  description: 'Creates a client or prospect in Moxie.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a client or prospect record in Moxie with address, billing and rate details; only Name is required and empty fields are not sent. Use when onboarding a new account, after Search Clients confirms it does not exist yet. Not idempotent: each call creates a separate client, even with the same name.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.client,
  props: {
    ...moxieProps.fromSpecs({ specs: moxieFields.clientCreate, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createClient({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
