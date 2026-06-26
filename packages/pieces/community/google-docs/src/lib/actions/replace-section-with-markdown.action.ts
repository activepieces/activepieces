import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const replaceSectionWithMarkdown = createAction({
  auth: googleDocsAuth,
  name: 'replace_section_with_markdown',
  displayName: 'Replace Section with Markdown',
  description: 'Replace a character range of a Google Docs document with Markdown content',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes the content between a start and end character index and replaces it with text rendered from Markdown (headings #/##/###, bullet lists -/*/+, paragraphs converted to native Google Docs formatting). Use when an agent wants to overwrite one section of a document — not the whole body — with freshly generated Markdown. Obtain start and end indices from Read Document first; indices cannot be guessed. Inline styling such as bold/italic is inserted as plain text. Destructive and not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to edit.',
      required: true,
    }),
    startIndex: Property.Number({
      displayName: 'Start Index',
      description: 'Inclusive start character index of the section to replace. Obtain from Read Document.',
      required: true,
    }),
    endIndex: Property.Number({
      displayName: 'End Index',
      description:
        'Exclusive end character index of the section to replace. Must be greater than Start Index and obtained from Read Document.',
      required: true,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown Content',
      description: 'Markdown text. Supports headings (#/##/###), bullet lists (-/*/+), and paragraphs.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, startIndex, endIndex, markdown } = context.propsValue;
    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    // Delete the section first, then insert the markdown at the now-empty
    // startIndex; the converter builds its inserts from that base index.
    const requests: docs_v1.Schema$Request[] = [
      { deleteContentRange: { range: { startIndex, endIndex } } },
      ...docsCommon.markdownToBatchRequests(markdown, startIndex),
    ];

    try {
      await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'replace a section of'));
    }

    return {
      success: true,
      documentId,
      replacedFrom: startIndex,
      replacedTo: endIndex,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  },
});
