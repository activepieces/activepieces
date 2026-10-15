import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { getDocBlocksActionOutputSchema } from '../../../output-schemas';

export const getDocBlocksAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_doc_blocks',
  classification: 'READ',
  displayName: 'Get Doc Blocks',
  description: 'Gets the content blocks of a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch the raw content blocks (ID, type, position, parent and JSON content) of a monday.com doc, paginated. Use when you need block IDs to update, delete or insert after a specific block; to read the doc as text prefer Export Doc as Markdown. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getDocBlocksActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of blocks per page (default 25).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
  },
  async run(context) {
    const { doc_id, limit, page } = context.propsValue;

    const data = await makeClient(context.auth).query<{ docs: { id: string; blocks: MondayDocBlock[] | null }[] | null }>({
      query: `query ($ids: [ID!], $limit: Int, $page: Int) {
        docs(ids: $ids) {
          id
          blocks(limit: $limit, page: $page) {
            id
            type
            position
            parent_block_id
            content
            created_at
            updated_at
            created_by { id }
          }
        }
      }`,
      variables: {
        ids: [doc_id],
        limit: limit ?? undefined,
        page: page ?? undefined,
      },
    });

    const doc = (data.docs ?? [])[0];
    if (!doc) {
      throw new Error(`Doc ${doc_id} was not found or is not accessible.`);
    }

    const blocks = (doc.blocks ?? []).map((block) => ({
      id: block.id,
      type: block.type ?? null,
      position: block.position ?? null,
      parent_block_id: block.parent_block_id ?? null,
      content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? null),
      created_by_id: block.created_by?.id ?? null,
      created_at: block.created_at ?? null,
      updated_at: block.updated_at ?? null,
    }));

    return { doc_id: doc.id, blocks, count: blocks.length };
  },
});

type MondayDocBlock = {
  id: string;
  type: string | null;
  position: number | null;
  parent_block_id: string | null;
  content: unknown;
  created_at: string | null;
  updated_at: string | null;
  created_by: { id: string } | null;
};
