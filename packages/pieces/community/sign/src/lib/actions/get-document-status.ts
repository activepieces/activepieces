import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const getDocumentStatus = createAction({
  auth: signAuth,
  name: 'get_document_status',
  displayName: "Consulter le statut d'une signature",
  description:
    "Consulte l'état d'avancement d'une demande de signature (en attente, signé, refusé…).",
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
      path: `/v1/documents/${document_id}`,
    });
    return { id: document_id, ...data };
  },
});
