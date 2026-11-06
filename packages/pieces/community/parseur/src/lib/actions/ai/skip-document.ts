import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurDocument } from '../../common/types';
import { documentOutputSchema } from '../../output-schemas';

export const skipDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_skip_document',
  outputSchema: documentOutputSchema,
  displayName: 'Skip Document',
  description: 'Marks a document as skipped, so it is not parsed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a Parseur document as skipped (status SKIPPED), so it is not parsed and uses no more credits. Reprocess Document parses it again. Returns the updated document.',
    idempotent: true,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurDocument>({
      auth,
      method: HttpMethod.POST,
      path: `/document/${encodeURIComponent(propsValue.documentId)}/skip`,
    });
  },
});
