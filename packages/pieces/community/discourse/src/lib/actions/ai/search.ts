import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const searchAction = createAction({
  auth: discourseAuth,
  name: 'search',
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Full-text search across Discourse topics, posts, users and categories.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Full-text search of a Discourse forum. The query supports Discourse search syntax such as @username, #category-slug, tags:name, status:open, in:title, after:2026-01-01 and order:latest. Returns matching topics, post blurbs, users and categories, 50 posts per page starting at page 1. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 1.', required: false }),
  },
  outputSchema: discourseSchemas.search,
  async run({ auth, propsValue }) {
    const query = discourseInput.text({ value: propsValue.query, label: 'Query' });
    const page = discourseInput.boundedNumber({ value: propsValue.page, label: 'Page', min: 1, max: 1000, fallback: 1 });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/search.json', query: { q: query, page } }),
    );
    const base = discourseOps.baseUrl(auth.props);
    const grouped = discourseMap.rec(body['grouped_search_result']);
    return {
      topics: discourseMap.list(body['topics']).map((raw) => discourseMap.topicSummary({ raw, baseUrl: base })),
      posts: discourseMap.list(body['posts']).map((raw) => {
        const post = discourseMap.rec(raw);
        return {
          id: discourseMap.num(post['id']),
          topic_id: discourseMap.num(post['topic_id']),
          post_number: discourseMap.num(post['post_number']),
          username: discourseMap.str(post['username']),
          blurb: discourseMap.str(post['blurb']),
          like_count: discourseMap.num(post['like_count']),
          created_at: discourseMap.str(post['created_at']),
        };
      }),
      users: discourseMap.list(body['users']).map((raw) => {
        const user = discourseMap.rec(raw);
        return {
          id: discourseMap.num(user['id']),
          username: discourseMap.str(user['username']),
          name: discourseMap.str(user['name']),
        };
      }),
      categories: discourseMap.list(body['categories']).map((raw) => {
        const category = discourseMap.rec(raw);
        return {
          id: discourseMap.num(category['id']),
          name: discourseMap.str(category['name']),
          slug: discourseMap.str(category['slug']),
        };
      }),
      page,
      has_more:
        grouped['more_full_page_results'] === true ||
        grouped['more_posts'] === true ||
        grouped['more_users'] === true ||
        grouped['more_categories'] === true,
    };
  },
});
