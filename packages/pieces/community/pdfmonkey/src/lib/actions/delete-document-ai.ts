import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdText } from '../common/props';

export const deleteDocumentAiAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'delete_document_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Document (AI)',
  description: 'Permanently delete a document and its file by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a PDFMonkey document and its generated file by document ID. Irreversible. A second call for the same ID fails with not found.',
    idempotent: false,
  },
  outputSchema: pdfmonkeySchemas.deleted,
  props: { document_id: documentIdText },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.deleteDocument({ auth, documentId: propsValue.document_id });
  },
});
