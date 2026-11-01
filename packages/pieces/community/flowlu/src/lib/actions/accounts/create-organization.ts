import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluProps, flowluWire } from '../../common/props';
import { accountEnvelopeOutputSchema } from '../../output-schemas';

export const createOrganizationAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_organization',
  classification: 'WRITE',
  displayName: 'Create CRM Account(Organization)',
  description: 'Creates a new organization in CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new company-type CRM account (an organization) in Flowlu, requiring an organization name. Use to add a business to the CRM; for individual people use Create CRM Account (Contact) instead. Not idempotent — each call creates a new organization record. For agents use flowlu_account_create.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: true,
    }),
    name_legal_full: Property.ShortText({
      displayName: 'Full legal name for Organization',
      required: false,
    }),
    ...flowluProps.account,
  },
  outputSchema: accountEnvelopeOutputSchema,
  async run(context) {
    const client = makeClient(context.auth);
    return await client.createAccount({
      ...flowluWire.account(context.propsValue),
      type: 1,
    });
  },
});
