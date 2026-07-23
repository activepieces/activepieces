import { createAction, Property } from '@activepieces/pieces-framework';
import { docsCommon } from '../common';
import { googleDocsAuth, getAccessToken } from '../auth';

export const createTextDocument = createAction({
  auth: googleDocsAuth,
  name: 'create_text_document',
  displayName: 'Create Text Document',
  description: 'Create a new Google Docs document with a title and plain text',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Google Docs document with the given title and writes the provided plain text into it, returning the new document metadata (including its ID). Use when an agent has plain text to put in a fresh document; for Markdown-formatted content use Create Document from Markdown instead. Not idempotent: each call creates a separate new document.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title (and file name) of the new document.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Content',
      description: 'The plain text to write into the new document.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = await getAccessToken(context.auth);
    const document = await docsCommon.createDocument(context.propsValue.title, accessToken);
    return await docsCommon.writeToDocument(document.documentId, context.propsValue.body, accessToken);
  },
});
