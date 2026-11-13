import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationMembersOutputSchema } from '../../../output-schemas';

export const searchOrganizationMembersAction = createAction({
  auth: podioAuth,
  name: 'podio_search_organization_members',
  outputSchema: podioGetOrganizationMembersOutputSchema,
  displayName: 'Search Organization Members',
  description: 'Searches the members of an organization by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds members of an organization whose name matches a search term; works without organization admin rights, unlike Get Organization Members. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    query: podioAiProps.text({ required: true, displayName: 'Search Term', description: 'The name, or part of it, to search for.' }),
    limit: podioAiProps.limit({ required: false }),
  },
  async run({ auth, propsValue }) {
    const query = podioUtils.query({ values: { query: propsValue.query, limit: propsValue.limit } });
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/member/search/`, query });
    return { members: body, count: body.length };
  },
});
