import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { listUsersOutputSchema } from '../output-schemas';

export const listUsersAction = createAction({
  auth: wordpressAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists site users, optionally filtered by name or role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists WordPress users with their IDs, display names and slugs, filtered by keyword or role. Use it to find an author ID for create_blog_post or list_posts; use get_current_user for the connected account. Without the list_users capability (Administrator) only users with published posts are returned and role filtering fails. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listUsersOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only users whose name, slug, email or URL contain this text.',
      required: false,
    }),
    roles: Property.Array({
      displayName: 'Roles',
      description: 'Only users with any of these role slugs, e.g. administrator, editor, author, contributor, subscriber.',
      required: false,
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
    const roles = wordpressContent.parseStringList({ values: propsValue.roles });
    if (roles) {
      queryParams['roles'] = roles.join(',');
    }
    const result = await wordpressApi.list<WordpressRecord>({ auth, path: '/users', queryParams });
    return {
      users: result.items,
      count: result.items.length,
      total: result.total,
      total_pages: result.total_pages,
    };
  },
});
