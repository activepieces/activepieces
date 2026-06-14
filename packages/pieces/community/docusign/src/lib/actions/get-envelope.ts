import { EnvelopesApi } from 'docusign-esign';

import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';

export const getEnvelope = createAction({
  name: 'getEnvelope',
  displayName: 'Get Signing Request Details',
  description:
    'Look up the full details of a signing request — status, recipients, and dates — using its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the full details of a single DocuSign envelope (signing request) by its envelope ID, including status, recipients, and dates. Use when you already know the envelope ID and need its current state; requires the account ID and envelope ID. Read-only and idempotent.',
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
    const envelopeApiClient = new EnvelopesApi(apiClient);
    return await envelopeApiClient.getEnvelope(
      propsValue.accountId,
      propsValue.envelopeId
    );
  },
});
