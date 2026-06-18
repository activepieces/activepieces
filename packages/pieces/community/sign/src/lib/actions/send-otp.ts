import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const sendOtp = createAction({
  auth: signAuth,
  name: 'send_otp',
  displayName: 'Envoyer un code de vérification (SMS)',
  description:
    'Envoie un code OTP par SMS au signataire pour vérifier son identité avant la signature.',
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
    signer_email: Property.ShortText({
      displayName: 'Email du signataire',
      required: true,
    }),
    signer_phone: Property.ShortText({
      displayName: 'Téléphone du signataire (format +33…)',
      required: true,
    }),
    document_name: Property.ShortText({
      displayName: 'Nom du document',
      required: false,
    }),
  },
  async run(context) {
    const { document_id, signer_email, signer_phone, document_name } =
      context.propsValue;
    const body: Record<string, unknown> = {
      document_id,
      signer_email,
      signer_phone,
    };
    if (document_name) body['document_name'] = document_name;
    return await signRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/otp/request',
      body,
    });
  },
});
