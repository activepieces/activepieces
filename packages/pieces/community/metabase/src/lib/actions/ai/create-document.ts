import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateDocumentOutputSchema } from '../../output-schemas';

export const createDocumentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_document',
  outputSchema: metabaseCreateDocumentOutputSchema,
  displayName: 'Create Document',
  description: 'Create a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a document (rich-text report) in a collection from plain text or ProseMirror JSON. Each call creates a new document.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description:
        'Plain-text content; blank lines separate paragraphs. Set this or Content, not both.',
      required: false,
    }),
    content: Property.Json({
      displayName: 'Content',
      description:
        'Rich content as a ProseMirror document, e.g. {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]}. Set this or Text, not both.',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.text !== undefined && propsValue.content !== undefined) {
      throw new Error('Set either Text or Content, not both.');
    }
    const document =
      propsValue.text === undefined
        ? propsValue.content
        : {
            type: 'doc',
            content: propsValue.text.split(/\n\s*\n/).map((paragraph) => ({
              type: 'paragraph',
              content: [{ type: 'text', text: paragraph }],
            })),
          };
    if (document === undefined) {
      throw new Error('Set Text or Content.');
    }
    return await metabaseApi.createDocument({
      auth,
      body: {
        name: propsValue.name,
        document,
        collection_id: propsValue.collectionId,
      },
    });
  },
});
