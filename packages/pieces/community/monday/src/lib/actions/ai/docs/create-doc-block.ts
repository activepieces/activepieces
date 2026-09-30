import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { createDocBlockActionOutputSchema } from '../../../output-schemas';

export const createDocBlockAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_doc_block',
  classification: 'WRITE',
  displayName: 'Create Doc Block',
  description: 'Adds a single block to a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Insert one typed block (text, title, list, quote, code, divider, notice box, table, layout, image, video, page break) into a monday.com doc, at the top or after a given block. The content is the block JSON, e.g. {"deltaFormat":[{"insert":"Hello"}]} for text; tables need column_count and row_count. For multi-block text prefer Append Markdown to Doc. Each call inserts a new block.',
    idempotent: false,
  },
  outputSchema: createDocBlockActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    type: Property.StaticDropdown({
      displayName: 'Block Type',
      required: true,
      defaultValue: 'normal_text',
      options: {
        options: [
          { label: 'Normal text', value: 'normal_text' },
          { label: 'Large title', value: 'large_title' },
          { label: 'Medium title', value: 'medium_title' },
          { label: 'Small title', value: 'small_title' },
          { label: 'Bulleted list', value: 'bulleted_list' },
          { label: 'Numbered list', value: 'numbered_list' },
          { label: 'Check list', value: 'check_list' },
          { label: 'Quote', value: 'quote' },
          { label: 'Code', value: 'code' },
          { label: 'Notice box', value: 'notice_box' },
          { label: 'Divider', value: 'divider' },
          { label: 'Page break', value: 'page_break' },
          { label: 'Table', value: 'table' },
          { label: 'Layout', value: 'layout' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    content: Property.Json({
      displayName: 'Content',
      description: 'Block content JSON, e.g. {"alignment":"left","direction":"ltr","deltaFormat":[{"insert":"new block"}]}.',
      required: true,
    }),
    after_block_id: Property.ShortText({
      displayName: 'After Block ID',
      description: 'Place the new block after this block. Resolve it with Get Doc Blocks. Leave empty to insert at the top.',
      required: false,
    }),
    parent_block_id: Property.ShortText({
      displayName: 'Parent Block ID',
      description: 'Create the block inside this parent block (e.g. a table cell or layout).',
      required: false,
    }),
  },
  async run(context) {
    const { doc_id, type, content, after_block_id, parent_block_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_doc_block: DocBlock | null }>({
      query: `mutation ($docId: ID!, $type: DocBlockContentType!, $content: JSON!, $afterBlockId: String, $parentBlockId: String) {
        create_doc_block(doc_id: $docId, type: $type, content: $content, after_block_id: $afterBlockId, parent_block_id: $parentBlockId) {
          id
          type
          position
          parent_block_id
          content
        }
      }`,
      variables: {
        docId: doc_id,
        type,
        content: mondayApi.toJsonString(content),
        afterBlockId: after_block_id || undefined,
        parentBlockId: parent_block_id || undefined,
      },
    });

    const block = data.create_doc_block;
    if (!block) {
      throw new Error('monday.com did not return the created block.');
    }

    return {
      id: block.id,
      doc_id,
      type: block.type ?? null,
      position: block.position ?? null,
      parent_block_id: block.parent_block_id ?? null,
      content: mondayApi.toJsonString(block.content ?? null),
    };
  },
});

type DocBlock = {
  id: string;
  type: string | null;
  position: number | null;
  parent_block_id: string | null;
  content: unknown;
};
