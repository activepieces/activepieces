import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurApi } from '../../common/api';
import { documentOutputSchema } from '../../output-schemas';

export const getDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_document',
  outputSchema: documentOutputSchema,
  displayName: 'Get Document',
  description: 'Gets one document with its parsed data.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Parseur document by ID: its status, the parsed data as a JSON string in "result", the text content and download links. Get the ID from List Documents or Upload File Document.',
    idempotent: true,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurApi.getDocument({
      auth,
      documentId: propsValue.documentId,
    });
  },
});
