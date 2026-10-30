import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateDocumentOutputSchema } from '../../output-schemas';

export const getDocumentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_document',
  outputSchema: metabaseCreateDocumentOutputSchema,
  displayName: 'Get Document',
  description: 'Get a document with its content.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one document with its rich-text content (ProseMirror JSON) and the cards it embeds.',
    idempotent: true,
  },
  props: {
    documentId: metabaseAiProps.documentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getDocument({
      auth,
      documentId: propsValue.documentId,
    });
  },
});
