import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceMembershipsForOrgMemberOutputSchema } from '../../../output-schemas';

export const getSpaceMembershipsForOrgMemberAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_memberships_for_org_member',
  outputSchema: podioGetSpaceMembershipsForOrgMemberOutputSchema,
  displayName: 'Get Space Memberships for Organization Member',
  description: 'Lists the workspaces an organization member belongs to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every workspace membership a member has in an organization, with their role and grant count; names and urls are left out for workspaces the caller is not in. Requires organization admin rights. The organization id comes from List Organizations and the user id from Get Organization Members.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the user, from Get Organization Members or Search Organization Members.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/member/${propsValue.userId}/space_member/` });
    return { memberships: body, count: body.length };
  },
});
