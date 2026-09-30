import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { exportDocAsMarkdownActionOutputSchema } from '../../../output-schemas';

export const exportDocAsMarkdownAction = createAction({
  auth: mondayAuth,
  name: 'monday_export_doc_as_markdown',
  classification: 'READ',
  displayName: 'Export Doc as Markdown',
  description: 'Exports the content of a monday doc as markdown.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read a monday.com doc (or only selected block IDs) as a single markdown string. Prefer this over Get Doc Blocks whenever you need to read or summarize the doc content. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: exportDocAsMarkdownActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    block_ids: Property.Array({
      displayName: 'Block IDs',
      description: 'Only export these blocks. Resolve them with Get Doc Blocks. Leave empty for the whole doc.',
      required: false,
    }),
  },
  async run(context) {
    const { doc_id } = context.propsValue;
    const blockIds = mondayApi.toStringArray(context.propsValue.block_ids);

    const data = await makeClient(context.auth).query<{ export_markdown_from_doc: ExportResult | null }>({
      query: `query ($docId: ID!, $blockIds: [String!]) {
        export_markdown_from_doc(docId: $docId, blockIds: $blockIds) {
          success
          markdown
          error
        }
      }`,
      variables: {
        docId: doc_id,
        blockIds: blockIds.length > 0 ? blockIds : undefined,
      },
    });

    const result = data.export_markdown_from_doc;
    if (!result || !result.success) {
      throw new Error(`monday.com could not export the doc: ${result?.error ?? 'unknown error'}`);
    }

    return {
      doc_id,
      markdown: result.markdown ?? '',
    };
  },
});

type ExportResult = {
  success: boolean;
  markdown: string | null;
  error: string | null;
};
