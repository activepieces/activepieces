import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { documentDropdown, parserDropdown } from '../common/properties';

export const getParsedDocumentById = createAction({
  auth: parseurAuth,
  name: 'getParsedDocumentById',
  displayName: 'Get Parsed Document by ID',
  description: 'Fetch parsed JSON / structured output for a given document ID',
  props: {
    parserId: parserDropdown({ required: true }),
    documentId: documentDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurCommon.getDocument({ apiKey, documentId });
  },
});
