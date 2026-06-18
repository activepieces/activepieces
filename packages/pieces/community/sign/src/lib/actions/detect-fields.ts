import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const detectFields = createAction({
  auth: signAuth,
  name: 'detect_fields',
  displayName: 'Détecter les champs de signature',
  description:
    "Analyse un PDF et retourne les emplacements de signature balisés ([[...]]) détectés, avant de l'envoyer à la signature.",
  props: {
    pdf: Property.File({
      displayName: 'Fichier PDF',
      required: true,
    }),
  },
  async run(context) {
    const { pdf } = context.propsValue;
    return await signRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/documents/detect-fields',
      body: { pdf_base64: pdf.base64 },
    });
  },
});
