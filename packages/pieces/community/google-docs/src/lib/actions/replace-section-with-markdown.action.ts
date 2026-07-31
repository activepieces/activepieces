import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';
import { replaceSectionWithMarkdownActionOutputSchema } from '../output-schemas';

export const replaceSectionWithMarkdown = createAction({
  auth: googleDocsAuth,
  name: 'replace_section_with_markdown',
  displayName: 'Replace Section with Markdown',
  description: 'Replace a character range of a Google Docs document with Markdown content',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes the content between a start and end character index and replaces it with text rendered from Markdown (headings #/##/###, bullet lists -/*/+, paragraphs converted to native Google Docs formatting). Use when an agent wants to overwrite one section of a document — not the whole body — with freshly generated Markdown. Obtain start and end indices from Read Document first; indices cannot be guessed. If the end index reaches the document end it is clamped to exclude the undeletable terminal newline. Inline styling such as bold/italic is inserted as plain text. Destructive and not idempotent.',
    idempotent: false,
  },
  outputSchema: replaceSectionWithMarkdownActionOutputSchema,
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
    const { documentId, startIndex, markdown } = context.propsValue;
    let { endIndex } = context.propsValue;
    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    // The body's terminal newline cannot be deleted, so if the caller passed an
    // end index at/after the body end (e.g. the value from Get Document End Index)
    // clamp it to one before the end — otherwise deleteContentRange 400s.
    let content: docs_v1.Schema$StructuralElement[];
    try {
      const response = await docs.documents.get({ documentId });
      content = response.data.body?.content ?? [];
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'read'));
    }
    const bodyEnd = content[content.length - 1]?.endIndex ?? endIndex;
    if (endIndex > bodyEnd - 1) {
      endIndex = bodyEnd - 1;
    }
    if (endIndex <= startIndex) {
      throw new Error('The section to replace is empty after clamping the end index to the document end.');
    }
    // A single deleteContentRange cannot remove a table or table of contents
    // that the range crosses, so a section replace over one is unsupported.
    const crossesStructuralElement = content.some(
      (element) =>
        (element.table || element.tableOfContents) &&
        (element.startIndex ?? 0) < endIndex &&
        (element.endIndex ?? 0) > startIndex
    );
    if (crossesStructuralElement) {
      throw new Error(
        'Cannot replace this section because it contains or overlaps a table or table of contents, which deleteContentRange cannot remove. Choose a range that excludes it, or edit it with the targeted table atomics.'
      );
    }

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
