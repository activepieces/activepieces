import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const validateSignature = createAction({
  auth: signAuth,
  name: 'validate_signature',
  displayName: "Vérifier l'intégrité de la signature",
  description:
    'Vérifie cryptographiquement que la signature PAdES du document est intègre et valide.',
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    const data = await signRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/documents/${document_id}/validate`,
    });
    return { id: document_id, ...data };
  },
});
