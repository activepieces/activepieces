import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { searchSiteContentOutputSchema } from '../output-schemas';

const subtypesByType: Record<string, string[]> = {
  post: ['post', 'page'],
  term: ['category', 'post_tag'],
  'post-format': [],
};

export const searchSiteContentAction = createAction({
  auth: wordpressAuth,
  name: 'search_site_content',
  classification: 'SEARCH',
  displayName: 'Search Site Content',
  description: 'Searches published posts and pages, or categories and tags, by keyword.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Keyword search across the WordPress site, returning only ID, title, URL and type for each match. By default it searches published posts and pages together; set Type to "term" to search categories and tags. Use list_posts or list_pages instead when you need drafts, full fields or filters. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchSiteContentOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to search for.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'What to search. Defaults to posts and pages.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Posts and pages', value: 'post' },
          { label: 'Categories and tags', value: 'term' },
          { label: 'Post formats', value: 'post-format' },
        ],
      },
    }),
    subtype: Property.StaticDropdown({
      displayName: 'Subtype',
      description:
        'Narrow the search within the chosen Type. "Post" and "Page" work only with Type "Posts and pages"; "Category" and "Tag" only with Type "Categories and tags". Leave empty for all.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Post', value: 'post' },
          { label: 'Page', value: 'page' },
          { label: 'Category', value: 'category' },
          { label: 'Tag', value: 'post_tag' },
        ],
      },
    }),
    ...wordpressContent.pagingProps(),
  },
  async run({ auth, propsValue }) {
    const type = wordpressContent.isFilledText(propsValue.type) ? propsValue.type : 'post';
    const queryParams: QueryParams = {
      ...wordpressContent.buildPaging({ perPage: propsValue.per_page, page: propsValue.page }),
      search: propsValue.search,
      type,
    };
    if (wordpressContent.isFilledText(propsValue.subtype)) {
      const allowed = subtypesByType[type] ?? [];
      if (!allowed.includes(propsValue.subtype)) {
        throw new Error(
          `Subtype "${propsValue.subtype}" does not belong to Type "${type}". Allowed: ${allowed.length > 0 ? allowed.join(', ') : 'none (leave Subtype empty)'}.`
        );
      }
      queryParams['subtype'] = propsValue.subtype;
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/search', queryParams });
    return {
      results: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
