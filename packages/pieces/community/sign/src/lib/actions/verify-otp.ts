import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const verifyOtp = createAction({
  auth: signAuth,
  name: 'verify_otp',
  displayName: 'Vérifier un code de vérification (SMS)',
  description:
    "Valide le code OTP saisi par le signataire et retourne l'URL de signature si le code est correct.",
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
    signer_email: Property.ShortText({
      displayName: 'Email du signataire',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code reçu par SMS',
      required: true,
    }),
  },
  async run(context) {
    const { document_id, signer_email, code } = context.propsValue;
    return await signRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/otp/verify',
      body: { document_id, signer_email, code },
    });
  },
});
