import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listInvitationsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_invitations',
  classification: 'SEARCH',
  displayName: 'List Invitation Links',
  description: 'Lists the invitation links with their role and groups.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every invitation link (ID, 6-character code, role and groups new members get). Use to find an invitation ID for Invite Emails to Invitation Link. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: heartbeatOutputSchemas.invitationList,
  async run({ auth }) {
    const invitations = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/invitations', operation: 'list invitation links' }),
    );
    return { invitations, count: invitations.length };
  },
});
