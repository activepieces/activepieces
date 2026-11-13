import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationMembersOutputSchema } from '../../../output-schemas';

export const getOrganizationMembersAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_members',
  outputSchema: podioGetOrganizationMembersOutputSchema,
  displayName: 'Get Organization Members',
  description: 'Lists the active and invited members of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the active and invited members of an organization, filtered by member type or a search term and sorted by name or last seen. Requires organization admin rights; use Search Organization Members otherwise. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    memberType: podioAiProps.choice({ required: false, displayName: 'Member Type', description: 'Only return members of this type.', values: ['employee', 'external', 'admin', 'regular', 'guest', 'premium'] }),
    query: podioAiProps.text({ required: false, displayName: 'Search Term', description: 'Only return members matching this term.' }),
    sortBy: podioAiProps.choice({ required: false, displayName: 'Sort By', description: 'Sort order of the results. Defaults to "name".', values: ['name', 'last_seen_on'] }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending. Defaults to "false".' }),
    limit: podioAiProps.limit({ required: false }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const query = podioUtils.query({
      values: {
        member_type: propsValue.memberType,
        query: propsValue.query,
        sort_by: propsValue.sortBy,
        sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
        limit: propsValue.limit,
        offset: propsValue.offset,
      },
    });
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/member/`, query });
    return { members: body, count: body.length };
  },
});
