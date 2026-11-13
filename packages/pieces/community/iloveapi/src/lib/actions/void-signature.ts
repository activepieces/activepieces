import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const voidSignatureAction = createAction({
  auth: iloveapiAuth,
  name: 'void_signature',
  classification: 'DESTRUCTIVE',
  displayName: 'Void Signature',
  description:
    'Cancel an in-progress signature request. The document becomes inaccessible to all signers.',
  audience: 'both',
  outputSchema: iloveSchemas.signatureAck,
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
    const tokenRequester = (context.propsValue.token_requester ?? '').trim();
    if (!tokenRequester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    const response = await iLoveApi.voidSignature({ token, tokenRequester });
    return {
      ...response,
      success: true,
      token_requester: tokenRequester,
    };
  },
});
