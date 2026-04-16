import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';
import { EnvelopesApi } from 'docusign-esign';

export const findEnvelopeRecipients = createAction({
  name: 'findEnvelopeRecipients',
  displayName: 'Find Recipients for Envelope',
  description:
    'Retrieves all recipients (signers, agents, editors, carbon copies, etc.) for a specific envelope by ID. Use this search when you need to fetch recipient data without triggering hydration timeouts in your trigger steps.',
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

    const recipients = await envelopesApiClient.listRecipients(
      propsValue.accountId,
      propsValue.envelopeId
    );

    return recipients;
  },
});
