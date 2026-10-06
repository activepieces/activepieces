import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatGroups } from '../common/groups';

export const createGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_group',
  classification: 'WRITE',
  displayName: 'Create Group',
  description: 'Creates a group, optionally under a parent group and with initial members.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a group with a name and optional description, parent group ID, initial member emails and isolated/joinable settings, and returns the new group. Use for cohorts, stages or access control. Not idempotent: each call creates another group even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    memberEmails: heartbeatProps.emails({ displayName: 'Member Emails', description: 'Emails of existing members to add (up to 100).', required: false }),
    parentGroupId: heartbeatProps.id({ displayName: 'Parent Group ID', description: 'Makes this a sub-group. Use List Groups to find the ID.', required: false }),
    isIsolated: Property.Checkbox({ displayName: 'Isolated', description: 'Members of an isolated group only see content shared with the group (see Heartbeat docs).', required: false }),
    isJoinable: Property.Checkbox({ displayName: 'Joinable', description: 'Members can join the group themselves.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.createdGroup,
  async run({ auth, propsValue }) {
    const name = heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' });
    const created = await heartbeatApi.request<unknown>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/groups',
      operation: 'create group',
      body: {
        name,
        description: heartbeatApi.optionalText(propsValue.description),
        members: heartbeatApi.listOrUndefined(heartbeatApi.emailList({ value: propsValue.memberEmails, label: 'Member Emails' })),
        parentGroupID: heartbeatApi.optionalUuid({ value: propsValue.parentGroupId, label: 'Parent Group ID' }),
        isIsolated: propsValue.isIsolated ?? undefined,
        isJoinable: propsValue.isJoinable ?? undefined,
      },
    });
    const groupId = heartbeatApi.isRecord(created) ? created['groupID'] : undefined;
    if (typeof groupId !== 'string') {
      throw new Error('Heartbeat created the group but did not return its ID. Use List Groups to find it.');
    }
    const lookup = await heartbeatApi.afterWrite({
      what: 'the new group',
      load: () => heartbeatGroups.getGroup({ token: auth.secret_text, groupId }),
    });
    return { ...(lookup.value ?? { id: groupId, name }), lookupError: lookup.lookupError };
  },
});
