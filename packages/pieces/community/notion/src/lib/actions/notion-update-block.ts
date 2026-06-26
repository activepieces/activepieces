import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

const RICH_TEXT_LIMIT = 2000;

// Block types whose body shape is `{ <type>: { rich_text: [...] } }`.
const TEXT_BLOCK_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'quote',
  'callout',
  'code',
] as const;

type TextBlockType = (typeof TEXT_BLOCK_TYPES)[number];

// Split text into <=2000-char chunks so each rich_text object respects Notion's cap.
function toRichText(content: string): Array<{ text: { content: string } }> {
  const chunks: Array<{ text: { content: string } }> = [];
  for (let i = 0; i < content.length; i += RICH_TEXT_LIMIT) {
    chunks.push({ text: { content: content.slice(i, i + RICH_TEXT_LIMIT) } });
  }
  // An empty string still needs one (empty) rich-text object to clear the block.
  return chunks.length > 0 ? chunks : [{ text: { content: '' } }];
}

export const notionUpdateBlock = createAction({
  auth: notionAuth,
  name: 'notion_update_block',
  displayName: 'Update Block Text',
  description: 'Replaces the text content of a single existing block by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Replaces the text content of a single existing block by id (resolve via notion_get_block_children). Use to edit one block's text in place; to add new blocks use notion_append_to_page. Safe to retry — re-applying the same content converges. The block_type must match the actual block's type; text is split at Notion's 2000-char-per-object cap. For to_do blocks also set checked; for code blocks set language.",
    idempotent: true,
  },
  props: {
    block_id: Property.ShortText({
      displayName: 'Block ID',
      description:
        'The id of the block to update. Resolve via notion_get_block_children.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        "The new plain-text content for the block. Split automatically at Notion's 2000-char-per-rich-text-object cap.",
      required: true,
    }),
    block_type: Property.StaticDropdown({
      displayName: 'Block Type',
      description:
        "The type of the block being updated — must match the block's actual type (see its type in notion_get_block_children). Defaults to paragraph.",
      required: false,
      defaultValue: 'paragraph',
      options: {
        options: [
          { label: 'Paragraph', value: 'paragraph' },
          { label: 'Heading 1', value: 'heading_1' },
          { label: 'Heading 2', value: 'heading_2' },
          { label: 'Heading 3', value: 'heading_3' },
          { label: 'Bulleted List Item', value: 'bulleted_list_item' },
          { label: 'Numbered List Item', value: 'numbered_list_item' },
          { label: 'To-do', value: 'to_do' },
          { label: 'Quote', value: 'quote' },
          { label: 'Callout', value: 'callout' },
          { label: 'Code', value: 'code' },
        ],
      },
    }),
    checked: Property.Checkbox({
      displayName: 'Checked',
      description:
        'For to_do blocks only: whether the checkbox is checked. Ignored for other block types.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'For code blocks only: the programming language (e.g. javascript, python). Ignored for other block types.',
      required: false,
    }),
  },
  async run(context) {
    const { block_id, content, block_type, checked, language } =
      context.propsValue;

    if (!block_id) {
      throw new Error('Block ID is required');
    }

    const type = (block_type ?? 'paragraph') as TextBlockType;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const body: Record<string, any> = {
      rich_text: toRichText(content),
    };
    if (type === 'to_do') {
      body['checked'] = checked ?? false;
    }
    if (type === 'code') {
      body['language'] = language ?? 'plain text';
    }

    try {
      return await notion.blocks.update({
        block_id: block_id as string,
        [type]: body,
      } as any);
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the block is not shared with it. Ensure your Notion integration has "Update content" capability and the parent page is shared with it.'
        );
      }
      if (error.code === 'object_not_found') {
        throw new Error(
          'Block not found. It may have been deleted or is not shared with the integration.'
        );
      }
      if (error.code === 'validation_error') {
        throw new Error(
          `Notion rejected the update: ${error.message}. Confirm the Block Type matches the block\'s actual type (see notion_get_block_children).`
        );
      }
      throw error;
    }
  },
});
