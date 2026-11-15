import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listPostsOutputSchema } from '../output-schemas';

export const listPostsAction = createAction({
  auth: wordpressAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'Lists blog posts, optionally filtered by keyword, status, category, tag, author or date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress blog posts with full post fields, filtered by keyword, status, category IDs, tag IDs, author or date range. Use it to find post IDs for get_post_by_id, update_blog_post or trash_post; use search_site_content for a quick keyword lookup across posts and pages together. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listPostsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only posts whose title, content or excerpt contain this text.',
      required: false,
    }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Post statuses to include. Defaults to published only. "Any" includes every status except trash.',
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
    categories: Property.Array({
      displayName: 'Category IDs',
      description: 'Only posts in any of these category IDs (from list_categories).',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag IDs',
      description: 'Only posts with any of these tag IDs (from list_tags).',
      required: false,
    }),
    author: Property.Number({
      displayName: 'Author ID',
      description: 'Only posts by this user ID (from list_users).',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'Published After',
      description: 'Only posts published after this ISO 8601 date, e.g. 2026-01-31T00:00:00.',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Published Before',
      description: 'Only posts published before this ISO 8601 date.',
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
    const categories = wordpressContent.parseIdList({ values: propsValue.categories, propName: 'Category IDs' });
    if (categories) {
      queryParams['categories'] = categories.join(',');
    }
    const tags = wordpressContent.parseIdList({ values: propsValue.tags, propName: 'Tag IDs' });
    if (tags) {
      queryParams['tags'] = tags.join(',');
    }
    if (wordpressContent.isSetNumber(propsValue.author)) {
      queryParams['author'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.author, propName: 'Author ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.after)) {
      queryParams['after'] = propsValue.after;
    }
    if (wordpressContent.isFilledText(propsValue.before)) {
      queryParams['before'] = propsValue.before;
    }
    if (wordpressContent.isFilledText(propsValue.orderby)) {
      queryParams['orderby'] = propsValue.orderby;
    }
    if (wordpressContent.isFilledText(propsValue.order)) {
      queryParams['order'] = propsValue.order;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/posts', queryParams });
    return {
      posts: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
