import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listCommentsOutputSchema } from '../output-schemas';

export const listCommentsAction = createAction({
  auth: wordpressAuth,
  name: 'list_comments',
  classification: 'SEARCH',
  displayName: 'List Comments',
  description: 'Lists comments, optionally filtered by post, status, author or keyword.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress comments filtered by post, moderation status, author or keyword. Defaults to approved comments; pick status "hold" to find comments awaiting moderation for moderate_comment. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listCommentsOutputSchema,
  props: {
    post: Property.Number({
      displayName: 'Post ID',
      description: 'Only comments on this post or page ID (from list_posts or list_pages).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Moderation status to list. Defaults to approved. Other statuses need a moderator (Editor or Administrator) connection.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Approved', value: 'approve' },
          { label: 'Pending (held for moderation)', value: 'hold' },
          { label: 'Spam', value: 'spam' },
          { label: 'Trash', value: 'trash' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only comments containing this text.',
      required: false,
    }),
    author: Property.Number({
      displayName: 'Author User ID',
      description: 'Only comments written by this registered user ID (from list_users).',
      required: false,
    }),
    parent: Property.Number({
      displayName: 'Parent Comment ID',
      description: 'Only replies to this comment ID. Use 0 for top-level comments.',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort direction by date. Defaults to newest first.',
      required: false,
      options: wordpressContent.orderOptions,
    }),
    ...wordpressContent.pagingProps(),
  },
  async run({ auth, propsValue }) {
    const queryParams: QueryParams = wordpressContent.buildPaging({
      perPage: propsValue.per_page,
      page: propsValue.page,
    });
    if (wordpressContent.isSetNumber(propsValue.post)) {
      queryParams['post'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.post, propName: 'Post ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.status)) {
      queryParams['status'] = propsValue.status;
    }
    if (wordpressContent.isFilledText(propsValue.search)) {
      queryParams['search'] = propsValue.search;
    }
    if (wordpressContent.isSetNumber(propsValue.author)) {
      queryParams['author'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.author, propName: 'Author User ID' })
      );
    }
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      queryParams['parent'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.parent, propName: 'Parent Comment ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.order)) {
      queryParams['order'] = propsValue.order;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/comments', queryParams });
    return {
      comments: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
