import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateDocumentOutputSchema } from '../../output-schemas';

export const updateDocumentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_document',
  outputSchema: metabaseCreateDocumentOutputSchema,
  displayName: 'Update Document',
  description: 'Rename, rewrite, move or archive a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a document. Text or Content replaces the whole body. Archived = Yes moves it to the trash (recoverable).',
    idempotent: true,
  },
  props: {
    documentId: metabaseAiProps.documentId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description:
        'Plain-text content; blank lines separate paragraphs. Replaces the body. Set this or Content, not both.',
      required: false,
    }),
    content: Property.Json({
      displayName: 'Content',
      description:
        'Rich content as a ProseMirror document, e.g. {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]}. Replaces the body. Set this or Text, not both.',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description: 'Move to this collection. Empty = unchanged.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes moves the document to the trash, No restores it. Empty = unchanged.',
      required: false,
    }),
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
    return await metabaseApi.updateDocument({
      auth,
      documentId: propsValue.documentId,
      body: {
        name: propsValue.name,
        document,
        collection_id: propsValue.collectionId,
        archived: propsValue.archived,
      },
    });
  },
});
