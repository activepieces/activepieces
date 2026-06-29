import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubListOrganizationRepositoriesAction = createAction({
  auth: githubAuth,
  name: 'list_organization_repositories',
  displayName: 'List Organization Repositories (Agent)',
  description: 'Lists the repositories in an organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the repositories in an organization (GET /orgs/{org}/repos). Returns all pages. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    org: Property.ShortText({
      displayName: 'Organization',
      description: 'The organization login.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { org } = propsValue;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/orgs/${org}/repos`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Organization "${org}"`);
    }
  },
});
