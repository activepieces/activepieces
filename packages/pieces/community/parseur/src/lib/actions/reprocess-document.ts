import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { documentDropdown, parserDropdown } from '../common/properties';

export const reprocessDocument = createAction({
  auth: parseurAuth,
  name: 'reprocessDocument',
  displayName: 'Reprocess Document',
  description:
    'Send an existing document back through parsing (e.g. after updating template).',
  audience: 'both',
  aiMetadata: {
    description:
      'Re-runs Parseur parsing on an existing document by its ID, typically after a template change so the document is re-evaluated. Requires the document ID and its parser/mailbox. Each call re-triggers processing (and any downstream exports/webhooks), so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parserDropdown({ required: true }),
    documentId: documentDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurCommon.reprocessDocument({
      apiKey:apiKey.secret_text,
      documentId,
    });
  },
});
