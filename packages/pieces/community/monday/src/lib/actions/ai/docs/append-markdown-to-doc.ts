import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { appendMarkdownToDocActionOutputSchema } from '../../../output-schemas';

export const appendMarkdownToDocAction = createAction({
  auth: mondayAuth,
  name: 'monday_append_markdown_to_doc',
  classification: 'WRITE',
  displayName: 'Append Markdown to Doc',
  description: 'Adds markdown content to an existing monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Convert markdown (headings, lists, bold, code, quotes, tables) into blocks and add them to an existing monday.com doc, at the end or after a given block ID. Prefer this over Create Doc Block for anything beyond a single block. Not idempotent: each call inserts another copy of the content.',
    idempotent: false,
  },
  outputSchema: appendMarkdownToDocActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    markdown: Property.LongText({
      displayName: 'Markdown',
      required: true,
    }),
    after_block_id: Property.ShortText({
      displayName: 'After Block ID',
      description: 'Insert the content after this block. Resolve it with Get Doc Blocks. Leave empty to append.',
      required: false,
    }),
  },
  async run(context) {
    const { doc_id, markdown, after_block_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ add_content_to_doc_from_markdown: MarkdownResult | null }>({
      query: `mutation ($docId: ID!, $markdown: String!, $afterBlockId: String) {
        add_content_to_doc_from_markdown(docId: $docId, markdown: $markdown, afterBlockId: $afterBlockId) {
          success
          block_ids
          error
        }
      }`,
      variables: {
        docId: doc_id,
        markdown,
        afterBlockId: after_block_id || undefined,
      },
    });

    const result = data.add_content_to_doc_from_markdown;
    if (!result || !result.success) {
      throw new Error(`monday.com could not add the markdown: ${result?.error ?? 'unknown error'}`);
    }

    return {
      doc_id,
      success: result.success,
      block_ids: (result.block_ids ?? []).join(', '),
      block_count: (result.block_ids ?? []).length,
    };
  },
});

type MarkdownResult = {
  success: boolean;
  block_ids: string[] | null;
  error: string | null;
};
