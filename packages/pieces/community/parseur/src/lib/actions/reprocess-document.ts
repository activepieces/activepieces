import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import { notificationOutputSchema } from '../output-schemas';

export const reprocessDocumentAction = createAction({
  auth: parseurAuth,
  name: 'reprocessDocument',
  outputSchema: notificationOutputSchema,
  classification: 'WRITE',
  displayName: 'Reprocess Document',
  description:
    'Send an existing document back through parsing (e.g. after updating template).',
  audience: 'human',
  aiMetadata: {
    description:
      'Re-runs Parseur parsing on an existing document by its ID, typically after a template change so the document is re-evaluated. Requires the document ID and its parser/mailbox. Each call re-triggers processing (and any downstream exports/webhooks), so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    documentId: parseurProps.documentId({ required: true }),
  },
  async run({ auth, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurApi.reprocessDocument({ auth, documentId });
  },
});
