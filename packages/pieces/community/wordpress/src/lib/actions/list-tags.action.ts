import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listTagsOutputSchema } from '../output-schemas';

export const listTagsAction = createAction({
  auth: wordpressAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists post tags, optionally filtered by name or post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress post tags with their IDs, names, slugs and post counts. Use it to turn a tag name into the ID that create_blog_post, update_blog_post and list_posts need; use create_tag to add a missing one. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listTagsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only tags whose name or slug contain this text.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Only the tag with this exact slug.',
      required: false,
    }),
    post: Property.Number({
      displayName: 'Post ID',
      description: 'Only tags assigned to this post ID (from list_posts).',
      required: false,
    }),
    hide_empty: Property.StaticDropdown({
      displayName: 'Hide Empty',
      description: 'Whether to leave out tags with no published posts. Defaults to No.',
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
    if (wordpressContent.isSetNumber(propsValue.post)) {
      queryParams['post'] = String(
        wordpressContent.requireWholeNumber({ value: propsValue.post, propName: 'Post ID' })
      );
    }
    if (wordpressContent.isFilledText(propsValue.hide_empty)) {
      queryParams['hide_empty'] = propsValue.hide_empty;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/tags', queryParams });
    return {
      tags: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
