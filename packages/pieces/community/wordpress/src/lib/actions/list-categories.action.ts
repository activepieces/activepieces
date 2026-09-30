import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listCategoriesOutputSchema } from '../output-schemas';

export const listCategoriesAction = createAction({
  auth: wordpressAuth,
  name: 'list_categories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description: 'Lists post categories, optionally filtered by name, parent or post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress post categories with their IDs, names, slugs, parents and post counts. Use it to turn a category name into the ID that create_blog_post, update_blog_post and list_posts need; use create_category to add a missing one. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listCategoriesOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only categories whose name or slug contain this text.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Only the category with this exact slug.',
      required: false,
    }),
    parent: Property.Number({
      displayName: 'Parent Category ID',
      description: 'Only direct children of this category ID. Use 0 for top-level categories.',
      required: false,
    }),
    post: Property.Number({
      displayName: 'Post ID',
      description: 'Only categories assigned to this post ID (from list_posts).',
      required: false,
    }),
    hide_empty: Property.StaticDropdown({
      displayName: 'Hide Empty',
      description: 'Whether to leave out categories with no published posts. Defaults to No.',
      required: false,
      options: wordpressContent.trueFalseOptions,
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
    if (wordpressContent.isFilledText(propsValue.slug)) {
      queryParams['slug'] = propsValue.slug;
    }
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      queryParams['parent'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.parent, propName: 'Parent Category ID' })
      );
    }
    if (wordpressContent.isSetNumber(propsValue.post)) {
      queryParams['post'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.post, propName: 'Post ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.hide_empty)) {
      queryParams['hide_empty'] = propsValue.hide_empty;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/categories', queryParams });
    return {
      categories: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
