import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const getSignerInfoAction = createAction({
  auth: iloveapiAuth,
  name: 'get_signer_info',
  classification: 'READ',
  displayName: 'Get Signer Info',
  description: 'Look up one signer of a signature request by the signer token.',
  audience: 'both',
  outputSchema: iloveSchemas.signerInfo,
  aiMetadata: {
    description:
      'Look up a single signer (receiver) of a signature request by its signer token, found in the "signers" list of Get Signature Status or Create Signature Request. Returns the signer\'s name, email, role and status. Read-only.',
    idempotent: true,
  },
  props: {
    token_signer: Property.ShortText({
      displayName: 'Signer Token',
      description: 'The signer\'s "token_signer" (or receiver token) from Get Signature Status.',
      required: true,
    }),
  },
  async run(context) {
    const tokenSigner = (context.propsValue.token_signer ?? '').trim();
    if (!tokenSigner) {
      throw new Error('Signer Token is required.');
    }
    const token = await iLoveApi.authenticate({ publicKey: context.auth.secret_text });
    const info = await iLoveApi.getSignerInfo({ token, tokenSigner });
    const accessCode = info['access_code'];
    return {
      ...info,
      access_code: accessCode === undefined || accessCode === null || accessCode === '' ? false : true,
    };
  },
});
