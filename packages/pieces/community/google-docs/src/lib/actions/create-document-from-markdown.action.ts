import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';

export const createDocumentFromMarkdown = createAction({
  auth: googleDocsAuth,
  name: 'create_document_from_markdown',
  displayName: 'Create Document from Markdown',
  description: 'Create a Google Docs document from Markdown content',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Google Docs document and populates it from Markdown text, converting headings (#, ##, ###), bullet lists (-, *, +), and paragraphs into native Google Docs formatting. Use when an agent has Markdown content (the format LLMs produce natively) and wants a formatted document in one call. Inline styling such as bold/italic is inserted as plain text. Not idempotent: each call creates a new document.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title (and file name) of the new document.',
      required: true,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown Content',
      description: 'Markdown text. Supports headings (#/##/###), bullet lists (-/*/+), and paragraphs.',
      required: true,
    }),
  },
  async run(context) {
    const { title, markdown } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    let documentId: string;
    try {
      const created = await docs.documents.create({ requestBody: { title } });
      if (!created.data.documentId) {
        throw new Error('Google Docs did not return a document ID for the new document.');
      }
      documentId = created.data.documentId;
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create'));
    }

    const requests = docsCommon.markdownToBatchRequests(markdown);
    if (requests.length > 0) {
      try {
        await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
      } catch (error) {
        throw new Error(docsCommon.formatError(error, 'populate the new'));
      }
    }

    return {
      success: true,
      documentId,
      title,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  },
});
