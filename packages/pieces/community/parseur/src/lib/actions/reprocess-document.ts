import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { documentDropdown, parserDropdown } from '../common/properties';

export const reprocessDocument = createAction({
  auth: parseurAuth,
  name: 'reprocessDocument',
  displayName: 'Reprocess Document',
  description:
    'Send an existing document back through parsing (e.g. after updating template).',
  props: {
    parserId: parserDropdown({ required: true }),
    documentId: documentDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurCommon.reprocessDocument({
      apiKey,
      documentId,
    });
  },
});
