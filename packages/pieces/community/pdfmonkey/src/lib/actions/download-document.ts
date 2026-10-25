import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdText } from '../common/props';

export const downloadDocumentAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'download_document',
  classification: 'READ',
  displayName: 'Download Document',
  description: 'Download a generated document as a file you can attach or upload in later steps.',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads the generated PDF (or image) of a PDFMonkey document by document ID and returns it as a file. The document must have status "success"; otherwise it fails and says the current status. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.download,
  props: {
    document_id: documentIdText,
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the downloaded file. Defaults to the document file name.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    return pdfmonkeyOperations.downloadDocument({ auth, documentId: propsValue.document_id, fileName: propsValue.file_name, files });
  },
});
