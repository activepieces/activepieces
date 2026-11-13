import { createAction, Property } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { createDocumentOperation } from '../operations/create-document';

export const createDocumentAction = createAction({
  auth: datalabAuth,
  name: 'create_document',
  classification: 'READ',
  displayName: 'Create Document',
  description:
    'Turns Markdown text into a Word (.docx) file, with optional tracked changes and comments. The file is stored in Activepieces and can be used by any step that takes a file. A saved file is limited to 10 MB on Activepieces Cloud.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turn Markdown text into a Word (.docx) file stored in Activepieces and return a file link any file-taking step can use; <ins>, <del> and <comment> tags become tracked changes and comments. Pick it to produce a Word document from text; to read or convert an existing document use Convert Document instead. Waits up to 4 minutes and, if Datalab is still working, returns completed=false with a request_id for Get Result instead of failing; each run spends Datalab credits and saves a new file (limited to 10 MB on Activepieces Cloud).',
    idempotent: true,
  },
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      description: `The document content in Markdown. Headings, lists, tables, bold, italics and links become Word formatting.

To add tracked changes and comments, wrap text in these tags:
- Insertion: \`<ins data-revision-author="Jane" data-revision-datetime="2026-01-15T10:00:00Z">added text</ins>\`. Both attributes are required; the date is ISO 8601.
- Deletion: \`<del data-revision-author="Jane" data-revision-datetime="2026-01-15T10:00:00Z">removed text</del>\`, with the same two required attributes.
- Comment: \`<comment data-comment-author="Jane" text="Please check this">commented text</comment>\`. \`data-comment-author\` and \`text\` are required; \`data-comment-datetime\` and \`data-comment-initial\` are optional.

See [Datalab's Create Document guide](${createDocumentOperation.DOCS_URL}).`,
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: `Name of the Word file to save. .docx is added when missing. Leave empty for ${createDocumentOperation.DEFAULT_FILE_NAME}.docx.`,
      placeholder: 'contract.docx',
      required: false,
    }),
  },
  outputSchema: createDocumentOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return createDocumentOperation.run({
      apiKey: auth.secret_text,
      files,
      markdown: propsValue.markdown,
      fileName: propsValue.file_name,
    });
  },
});
