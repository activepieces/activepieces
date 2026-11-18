import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetOrganizationMemberOutputSchema } from '../../../output-schemas';

export const getOrganizationMemberAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_member',
  outputSchema: podioGetOrganizationMemberOutputSchema,
  displayName: 'Get Organization Member',
  description: 'Gets one member of an organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one member of an organization: account email, profile, employee flag, organization role and how many workspaces they are in. The organization id comes from List Organizations and the user id from Get Organization Members or Search Organization Members.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the user, from Get Organization Members or Search Organization Members.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/member/${propsValue.userId}` });
  },
});
