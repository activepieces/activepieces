import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurApi } from '../../common/api';
import { notificationOutputSchema } from '../../output-schemas';

export const reprocessDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_reprocess_document',
  outputSchema: notificationOutputSchema,
  displayName: 'Reprocess Document',
  description: 'Runs parsing again on a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Parses an existing Parseur document again, e.g. after its mailbox\'s fields or templates changed. Uses credits and re-sends the result to the mailbox\'s webhooks and exports. Asynchronous: read the new result later with Get Document.',
    idempotent: false,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurApi.reprocessDocument({
      auth,
      documentId: propsValue.documentId,
    });
  },
});
