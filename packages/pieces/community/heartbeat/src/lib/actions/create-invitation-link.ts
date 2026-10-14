import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const createInvitationLinkAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_invitation_link',
  classification: 'WRITE',
  displayName: 'Create Invitation Link',
  description: 'Creates an invitation link that gives new members a role and groups.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates an invitation link; people who join through it get the given role ID and group IDs. Returns the link ID and its 6-character code. No email is sent. Not idempotent: each call creates another link.',
    idempotent: false,
  },
  props: {
    roleId: heartbeatProps.id({ displayName: 'Role ID', description: 'Use List Roles to find the ID.', required: true }),
    groupIds: heartbeatProps.ids({ displayName: 'Group IDs', description: 'Groups new members join. Use List Groups to find IDs.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.invitation,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/invitations',
      operation: 'create invitation link',
      body: {
        roleID: heartbeatApi.uuid({ value: propsValue.roleId, label: 'Role ID' }),
        groupIDs: heartbeatApi.uuidList({ value: propsValue.groupIds, label: 'Group IDs' }),
      },
    });
  },
});
