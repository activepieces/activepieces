import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubListOrganizationMembersAction = createAction({
  auth: githubAuth,
  name: 'list_organization_members',
  displayName: 'List Organization Members (Agent)',
  description: 'Lists the members of an organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the members of an organization (GET /orgs/{org}/members). Visibility is gated: private members appear only with org-read access (OAuth has it via admin:org); under GitHub App auth the bot lacks user-org context and may see a limited or empty list. Returns all pages. Read-only and idempotent.',
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
        resourceUri: `/orgs/${org}/members`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Organization "${org}"`);
    }
  },
});
