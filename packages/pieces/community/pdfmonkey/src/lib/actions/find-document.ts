import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';
import { documentIdDropdown } from '../common/props';

export const findDocumentAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'findDocument',
  classification: 'READ',
  displayName: 'Find Document',
  description: 'Finds a document by ID.',
  audience: 'human',
  aiMetadata: {
    description:
      'Gets a PDFMonkey document picked in a dropdown, with its status, payload, generation logs and download URL. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.wrappedFullDocument,
  props: {
    document_id: documentIdDropdown,
  },
  async run({ auth, propsValue }) {
    const document = await pdfmonkeyOperations.getDocument({ auth, documentId: propsValue.document_id });
    return { document };
  },
});
