import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

const SPACE_ROLES = ['light', 'regular', 'admin'];

export const updateSpaceMembershipsAction = createAction({
  auth: podioAuth,
  name: 'podio_update_space_memberships',
  displayName: 'Update Space Memberships',
  description: 'Changes the role of one or more members of a space.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the role of one or more existing space members to light, regular or admin. User ids come from List Space Members.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    userIds: podioAiProps.idList({ required: true, displayName: 'User IDs', description: 'The ids of the members whose role changes.' }),
    role: podioAiProps.choice({ required: true, displayName: 'Role', description: 'The new role of the members.', values: SPACE_ROLES }),
  },
  async run({ auth, propsValue }) {
    if (!SPACE_ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${SPACE_ROLES.join(', ')}.`);
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/space/${propsValue.spaceId}/member/${propsValue.userIds.join(',')}`,
      body: { role: propsValue.role },
    });
  },
});
