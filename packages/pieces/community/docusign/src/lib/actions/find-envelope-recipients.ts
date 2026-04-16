import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';
import { EnvelopesApi } from 'docusign-esign';

export const findEnvelopeRecipients = createAction({
  name: 'findEnvelopeRecipients',
  displayName: 'Get Envelope Recipients',
  description:
    'Retrieve all recipients (signers, carbon copies, etc.) for an envelope.',
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
