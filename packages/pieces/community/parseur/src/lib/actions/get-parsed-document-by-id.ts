import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import { documentOutputSchema } from '../output-schemas';

export const getParsedDocumentByIdAction = createAction({
  auth: parseurAuth,
  name: 'getParsedDocumentById',
  outputSchema: documentOutputSchema,
  classification: 'READ',
  displayName: 'Get Parsed Document by ID',
  description: 'Fetch parsed JSON / structured output for a given document ID',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves the parsed/structured data of a single Parseur document by its ID. Use to read back the extracted fields after a document has been processed. Requires the document ID (and the parser/mailbox it belongs to); read-only and idempotent.',
    idempotent: true,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    documentId: parseurProps.documentId({ required: true }),
  },
  async run({ auth, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurApi.getDocument({ auth, documentId });
  },
});
