import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listPagesOutputSchema } from '../output-schemas';

export const listPagesAction = createAction({
  auth: wordpressAuth,
  name: 'list_pages',
  classification: 'SEARCH',
  displayName: 'List Pages',
  description: 'Lists site pages, optionally filtered by keyword, status or parent page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress static pages with full page fields, filtered by keyword, status or parent page. Use it to find page IDs for get_page, update_page or trash_page; use list_posts for blog posts. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listPagesOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only pages whose title or content contain this text.',
      required: false,
    }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Page statuses to include. Defaults to published only. "Any" includes every status except trash.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Published', value: 'publish' },
          { label: 'Draft', value: 'draft' },
          { label: 'Pending Review', value: 'pending' },
          { label: 'Private', value: 'private' },
          { label: 'Scheduled', value: 'future' },
          { label: 'Trash', value: 'trash' },
          { label: 'Any', value: 'any' },
        ],
      },
    }),
    parent: Property.Number({
      displayName: 'Parent Page ID',
      description: 'Only direct children of this page ID. Use 0 for top-level pages.',
      required: false,
    }),
    orderby: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort field. Defaults to date. "Relevance" needs Search.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Date', value: 'date' },
          { label: 'Modified Date', value: 'modified' },
          { label: 'Title', value: 'title' },
          { label: 'ID', value: 'id' },
          { label: 'Slug', value: 'slug' },
          { label: 'Menu Order', value: 'menu_order' },
          { label: 'Relevance', value: 'relevance' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort direction. Defaults to descending.',
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
    if (wordpressContent.isFilledText(propsValue.search)) {
      queryParams['search'] = propsValue.search;
    }
    if (propsValue.orderby === 'relevance' && queryParams['search'] === undefined) {
      throw new Error('Order By "Relevance" needs a Search value.');
    }
    if (propsValue.status && propsValue.status.length > 0) {
      queryParams['status'] = propsValue.status.join(',');
    }
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      queryParams['parent'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.parent, propName: 'Parent Page ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.orderby)) {
      queryParams['orderby'] = propsValue.orderby;
    }
    if (wordpressContent.isFilledText(propsValue.order)) {
      queryParams['order'] = propsValue.order;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/pages', queryParams });
    return {
      pages: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
