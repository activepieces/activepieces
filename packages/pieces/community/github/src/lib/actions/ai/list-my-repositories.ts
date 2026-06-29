import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubListMyRepositoriesAction = createAction({
  auth: githubAuth,
  name: 'list_my_repositories',
  displayName: 'List My Repositories (Agent)',
  description: 'Lists repositories the connected account can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the repositories the connected user can access (GET /user/repos) — the top-level resolver for owner/repo used by most other GitHub atomics. Filter by visibility, affiliation, and sort. Returns all pages. Under GitHub App auth the token is a bot, so this reflects the installation, not a user. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    affiliation: Property.ShortText({
      displayName: 'Affiliation',
      description: 'Comma-separated: owner, collaborator, organization_member.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
          { label: 'Pushed', value: 'pushed' },
          { label: 'Full Name', value: 'full_name' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const query: RequestParams = {};
    if (propsValue.visibility) query['visibility'] = propsValue.visibility;
    if (propsValue.affiliation) query['affiliation'] = propsValue.affiliation;
    if (propsValue.sort) query['sort'] = propsValue.sort;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/user/repos`,
        query,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, 'The authenticated user');
    }
  },
});
