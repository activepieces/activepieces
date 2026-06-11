import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';
import { EnvelopesApi } from 'docusign-esign';

export const findEnvelopeRecipients = createAction({
  name: 'findEnvelopeRecipients',
  displayName: 'Get People on a Signing Request',
  description:
    'Get the full list of people on a signing request — signers, viewers, and anyone copied.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the list of all recipients on a DocuSign envelope by its ID — signers, carbon copies, certified deliveries, and other roles — along with their status. Use when you need to know who is on a signing request and where each person stands; requires the account ID and envelope ID. Read-only and idempotent.',
    idempotent: true,
  },
  auth: docusignAuth,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    envelopeId: Property.ShortText({
      displayName: 'Envelope ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const envelopesApiClient = new EnvelopesApi(apiClient);

    return await envelopesApiClient.listRecipients(
      propsValue.accountId,
      propsValue.envelopeId
    );
  },
});
