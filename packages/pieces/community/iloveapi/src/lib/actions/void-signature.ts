import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const voidSignatureAction = createAction({
  auth: iloveapiAuth,
  name: 'void_signature',
  displayName: 'Void Signature',
  description:
    'Cancel an in-progress signature request. The document becomes inaccessible to all signers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently cancel an in-progress signature request by its requester token, after which the document can no longer be signed and becomes inaccessible to every signer. This is a destructive, irreversible state change; calling it again on an already-voided request has no further effect.',
    idempotent: false,
  },
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the signature request to void.',
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
    return await iLoveApi.voidSignature({
      token,
      tokenRequester: token_requester,
    });
  },
});
