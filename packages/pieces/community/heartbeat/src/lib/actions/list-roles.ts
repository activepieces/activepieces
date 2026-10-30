import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listRolesAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_roles',
  classification: 'SEARCH',
  displayName: 'List Roles',
  description: 'Lists the roles in the community with their IDs.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every role in the community (ID and name, for example Administrator, Moderator, User). Use to get a role ID for Create Member, Pre-register Member or Create Invitation Link. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: heartbeatOutputSchemas.roleList,
  async run({ auth }) {
    const roles = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/roles', operation: 'list roles' }),
    );
    return { roles, count: roles.length };
  },
});
