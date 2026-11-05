import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatGroups } from '../common/groups';

export const getGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_group',
  classification: 'READ',
  displayName: 'Get Group',
  description: 'Gets one group with its members.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one group by ID with name, description, color, parent group, archived flag and its members (ID, name, email). Use to check who is in a group. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Use List Groups to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.group,
  async run({ auth, propsValue }) {
    return heartbeatGroups.getGroup({ token: auth.secret_text, groupId: heartbeatApi.uuid({ value: propsValue.groupId, label: 'Group ID' }) });
  },
});
