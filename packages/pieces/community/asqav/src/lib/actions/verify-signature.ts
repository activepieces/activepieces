import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asqavApiCall } from '../common';
import { asqavAuth } from '../auth';

export const verifySignature = createAction({
  name: 'verify_signature',
  auth: asqavAuth,
  displayName: 'Verify Signature',
  description:
    'Verify a signed Asqav receipt by its signature ID and return the verification result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up an Asqav receipt by its signature ID and return whether it verifies. Use to check a receipt produced earlier by Sign Action. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    signatureId: Property.ShortText({
      displayName: 'Signature ID',
      description:
        'The signature ID returned by the Sign Action step, for example "sig_...".',
      required: true,
    }),
  },
  async run(context) {
    return asqavApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/verify/${context.propsValue.signatureId}`,
    });
  },
});