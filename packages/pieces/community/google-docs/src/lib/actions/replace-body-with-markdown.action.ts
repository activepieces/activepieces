import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const replaceBodyWithMarkdown = createAction({
  auth: googleDocsAuth,
  name: 'replace_body_with_markdown',
  displayName: 'Replace Body with Markdown',
  description: 'Replace the entire body of a Google Docs document with Markdown content',
  audience: 'ai',
  aiMetadata: {
    description:
      'Clears the entire body of an existing Google Docs document and repopulates it from Markdown text, converting headings (#, ##, ###), bullet lists (-, *, +), and paragraphs into native Google Docs formatting. Use when an agent wants to overwrite a document wholesale with freshly generated Markdown (the format LLMs produce natively) in one call. Inline styling such as bold/italic is inserted as plain text. Destructive and not idempotent: the previous body content is deleted.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to overwrite.',
      required: true,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown Content',
      description: 'Markdown text. Supports headings (#/##/###), bullet lists (-/*/+), and paragraphs.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, markdown } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    let bodyEnd: number;
    try {
      const response = await docs.documents.get({ documentId });
      const content = response.data.body?.content ?? [];
      const lastElement = content[content.length - 1];
      bodyEnd = lastElement?.endIndex ?? 1;
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'read'));
    }

    const requests: docs_v1.Schema$Request[] = [];
    // The body always ends in an undeletable trailing newline, so the deletable
    // range is [1, bodyEnd-1); only delete when there is real content to remove.
    if (bodyEnd > 2) {
      requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: bodyEnd - 1 } } });
    }
    requests.push(...docsCommon.markdownToBatchRequests(markdown));

    try {
      await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'replace the body of'));
    }

    return {
      success: true,
      documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  },
});
