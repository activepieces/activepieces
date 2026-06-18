import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const cancelDocument = createAction({
  auth: signAuth,
  name: 'cancel_document',
  displayName: 'Annuler une demande de signature',
  description:
    'Annule une demande de signature encore en cours. Impossible si le document est déjà signé.',
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    return await signRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v1/documents/${document_id}`,
    });
  },
});
