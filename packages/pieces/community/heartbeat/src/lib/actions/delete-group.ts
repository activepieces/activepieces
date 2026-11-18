import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const deleteGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_delete_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Group',
  description: 'Deletes a group. Members stay in the community.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a group by ID; its members stay in the community but lose the group. Use only when explicitly asked. Heartbeat refuses some deletions and the reason is returned as the error. A repeat call finds it gone and reports alreadyDeleted=true, so it is idempotent.',
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Use List Groups to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.deleted,
  async run({ auth, propsValue }) {
    const groupId = heartbeatApi.uuid({ value: propsValue.groupId, label: 'Group ID' });
    try {
      await heartbeatApi.request({ token: auth.secret_text, method: HttpMethod.DELETE, path: `/groups/${groupId}`, operation: 'delete group' });
      return { id: groupId, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (heartbeatApi.statusOf(error) === 404) {
        return { id: groupId, deleted: true, alreadyDeleted: true };
      }
      throw error;
    }
  },
});
