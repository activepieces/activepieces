import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdDropdown } from '../common/props';

export const deleteDocumentAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'deleteDocument',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Document',
  description: 'Deletes a document.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes a PDFMonkey document picked in a dropdown, together with its file. Irreversible; a second call for the same ID fails with not found.',
    idempotent: false,
  },
  outputSchema: pdfmonkeySchemas.legacyDeleted,
  props: {
    document_id: documentIdDropdown,
  },
  async run({ auth, propsValue }) {
    const result = await pdfmonkeyOperations.deleteDocument({ auth, documentId: propsValue.document_id });
    return {
      status: 'success',
      message: 'Document deleted successfully.',
      document_id: result.document_id,
    };
  },
});
