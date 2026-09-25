import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { importDocFromHtmlActionOutputSchema } from '../../../output-schemas';

export const importDocFromHtmlAction = createAction({
  auth: mondayAuth,
  name: 'monday_import_doc_from_html',
  classification: 'WRITE',
  displayName: 'Import Doc from HTML',
  description: 'Creates a new monday doc in a workspace from HTML content.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new monday.com doc in a workspace (optionally inside a folder) from HTML; text styles, headings, lists, quotes, tables, code and dividers are converted to doc blocks. Use when you have HTML content; for an empty doc use Create Doc, to add to an existing doc use Append Markdown to Doc. Each call creates a new doc.',
    idempotent: false,
  },
  outputSchema: importDocFromHtmlActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    html: Property.LongText({
      displayName: 'HTML',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Doc title. If empty, monday.com infers it from the HTML.',
      required: false,
    }),
    folder_id: mondayAiProps.folderId(false),
    kind: Property.StaticDropdown({
      displayName: 'Doc Kind',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Shareable', value: 'share' },
        ],
      },
    }),
  },
  async run(context) {
    const { workspace_id, html, title, folder_id, kind } = context.propsValue;

    const data = await makeClient(context.auth).query<{ import_doc_from_html: ImportResult | null }>({
      query: `mutation ($html: String!, $workspaceId: ID!, $title: String, $folderId: ID, $kind: DocKind) {
        import_doc_from_html(html: $html, workspaceId: $workspaceId, title: $title, folderId: $folderId, kind: $kind) {
          success
          doc_id
          error
        }
      }`,
      variables: {
        html,
        workspaceId: workspace_id,
        title: title || undefined,
        folderId: folder_id || undefined,
        kind: kind ?? undefined,
      },
    });

    const result = data.import_doc_from_html;
    if (!result || !result.success) {
      throw new Error(`monday.com could not import the HTML: ${result?.error ?? 'unknown error'}`);
    }

    return {
      doc_id: result.doc_id ?? null,
      success: result.success,
    };
  },
});

type ImportResult = {
  success: boolean;
  doc_id: string | null;
  error: string | null;
};
