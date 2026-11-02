import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdText } from '../common/props';

export const getDocumentAiAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'get_document_ai',
  classification: 'READ',
  displayName: 'Get Document (AI)',
  description: 'Get a document\'s status, file name and download link by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one PDFMonkey document by document ID: status (draft, pending, generating, success, failure), failure cause, file name, template, meta and a download URL valid for 1 hour once status is "success". Use it to check whether generation finished. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.document,
  props: { document_id: documentIdText },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.getDocumentCard({ auth, documentId: propsValue.document_id });
  },
});
