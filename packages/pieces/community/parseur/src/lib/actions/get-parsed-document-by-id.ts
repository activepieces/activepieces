import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { documentDropdown, parserDropdown } from '../common/properties';

export const getParsedDocumentById = createAction({
  auth: parseurAuth,
  name: 'getParsedDocumentById',
  displayName: 'Get Parsed Document by ID',
  description: 'Fetch parsed JSON / structured output for a given document ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the parsed/structured data of a single Parseur document by its ID. Use to read back the extracted fields after a document has been processed. Requires the document ID (and the parser/mailbox it belongs to); read-only and idempotent.',
    idempotent: true,
  },
  props: {
    parserId: parserDropdown({ required: true }),
    documentId: documentDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurCommon.getDocument({ apiKey: apiKey.secret_text, documentId });
  },
});
