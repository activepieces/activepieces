import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const getSignatureStatusAction = createAction({
  auth: iloveapiAuth,
  name: 'get_signature_status',
  displayName: 'Get Signature Status',
  description:
    'Look up the current status of a signature request, including each signer.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up the current status of a signature request by its requester token, including the per-signer state. Read-only and safe to poll repeatedly; use this to check whether a request is completed before downloading signed files or the audit trail.',
    idempotent: true,
  },
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description:
        'The "token_requester" returned when the signature request was created.',
      required: true,
    }),
  },
  async run(context) {
    const { token_requester } = context.propsValue;
    if (!token_requester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    return await iLoveApi.getSignatureStatus({
      token,
      tokenRequester: token_requester,
    });
  },
});
