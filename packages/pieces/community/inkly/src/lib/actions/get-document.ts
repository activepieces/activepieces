import { createAction } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyClient } from '../common/client';
import { inklyOutput } from '../common/output';
import { inklyProps } from '../common/props';
import { inklyOutputSchemas } from '../output-schemas';

export const getDocumentAction = createAction({
  auth: inklyAuth,
  name: 'get_document',
  classification: 'READ',
  displayName: 'Get Document',
  description: "Gets a document's status, its signers, and the values they filled in.",
  audience: 'both',
  aiMetadata: {
    description:
      "Read one Inkly document by ID: its status, each signer's progress, and the field values signers filled in. Use it to check whether a document has been signed. Safe to retry.",
    idempotent: true,
  },
  outputSchema: inklyOutputSchemas.getDocument,
  props: {
    document: inklyProps.document({
      description: 'The document to read. Type to search by title or signer, or map a Document ID from an earlier step.',
    }),
  },
  async run(context) {
    const item = await inklyClient.getDocument({
      apiKey: context.auth.secret_text,
      documentId: context.propsValue.document,
    });
    return inklyOutput.document({ item, withFieldValues: true });
  },
});
