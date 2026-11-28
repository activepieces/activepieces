import { createAction } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyClient } from '../common/client';
import { inklyProps } from '../common/props';
import { inklyOutputSchemas } from '../output-schemas';

export const downloadSignedPdfAction = createAction({
  auth: inklyAuth,
  name: 'download_signed_pdf',
  classification: 'READ',
  displayName: 'Download Signed PDF',
  description: 'Downloads the signed PDF of a completed document, ready to save to cloud storage or attach to an email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Download the signed PDF of a completed Inkly document as a file. Works only once every signer has signed; use Get Document first to check the status. Safe to retry.',
    idempotent: true,
  },
  outputSchema: inklyOutputSchemas.downloadSignedPdf,
  props: {
    document: inklyProps.document({
      status: 'completed',
      description: 'A completed document. Type to search by title or signer, or map a Document ID from an earlier step.',
    }),
  },
  async run(context) {
    const documentId = context.propsValue.document;
    const pdf = await inklyClient.downloadSignedPdf({ apiKey: context.auth.secret_text, documentId });
    const file = await context.files.write({ fileName: pdf.fileName, data: pdf.data });
    return {
      document_id: documentId,
      file_name: pdf.fileName,
      file,
    };
  },
});
