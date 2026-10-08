import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listGroupsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_groups',
  classification: 'SEARCH',
  displayName: 'List Groups',
  description: 'Lists the groups in the community.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists all groups (ID, name, description, parent group, archived flag), optionally with their members. Use to get group IDs for membership, events, channels and invitations. Archived groups are left out unless Include Archived is on. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    includeArchived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    includeMembers: Property.Checkbox({ displayName: 'Include Members', description: 'Also return each group member (ID, name, email).', required: false, defaultValue: false }),
  },
  outputSchema: heartbeatOutputSchemas.groupList,
  async run({ auth, propsValue }) {
    const groups = heartbeatApi
      .recordList(await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/groups', operation: 'list groups' }))
      .filter((group) => propsValue.includeArchived === true || group['archived'] !== true)
      .map((group) =>
        propsValue.includeMembers === true
          ? group
          : Object.fromEntries(Object.entries(group).filter(([key]) => key !== 'users')),
      );
    return { groups, count: groups.length };
  },
});
