import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListSpaceMembersByRoleOutputSchema } from '../../../output-schemas';

const SPACE_ROLES = ['light', 'regular', 'admin'];

export const listSpaceMembersByRoleAction = createAction({
  auth: podioAuth,
  name: 'podio_list_space_members_by_role',
  outputSchema: podioListSpaceMembersByRoleOutputSchema,
  displayName: 'List Space Members by Role',
  description: 'Lists the members of a space that have one role.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the active members of a space with the given role (light, regular or admin), unpaged; for all members use List Space Memberships. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    role: podioAiProps.choice({ required: true, displayName: 'Role', description: 'The role to list members for.', values: SPACE_ROLES }),
  },
  async run({ auth, propsValue }) {
    if (!SPACE_ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${SPACE_ROLES.join(', ')}.`);
    }
    const members = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/member/${propsValue.role}/` });
    return { members, count: members.length };
  },
});
