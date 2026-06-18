import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

interface SignedDocResponse {
  pdf_base64?: string;
  title?: string;
  size_bytes?: number;
}

export const downloadSignedDocument = createAction({
  auth: signAuth,
  name: 'download_signed_document',
  displayName: 'Télécharger le document signé',
  description:
    'Récupère le PDF final signé (avec signature PAdES qualifiée et certificat de preuve intégré). Disponible une fois le document complété.',
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    const data = await signRequest<SignedDocResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/documents/${document_id}/download`,
    });
    const pdfBuffer = Buffer.from(data.pdf_base64 || '', 'base64');
    const filename = `${data.title || document_id}.pdf`;
    const file = await context.files.write({
      fileName: filename,
      data: pdfBuffer,
    });
    return {
      document_id,
      title: data.title,
      size_bytes: data.size_bytes,
      file,
    };
  },
});
