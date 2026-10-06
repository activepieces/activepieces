import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatGroups } from '../common/groups';

export const updateGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_update_group',
  classification: 'WRITE',
  displayName: 'Update Group',
  description: 'Changes a group. Fields left empty stay as they are.',
  audience: 'both',
  aiMetadata: {
    description: "Changes a group's name, description, isolated or joinable setting; omitted fields (and 'unchanged') stay as they are, and a call with nothing to change is refused. Use after List Groups. Applying the same values again changes nothing, so it is idempotent.",
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Use List Groups to find the ID.', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    isIsolated: heartbeatProps.triState({ displayName: 'Isolated', description: 'Members of an isolated group only see content shared with the group.' }),
    isJoinable: heartbeatProps.triState({ displayName: 'Joinable', description: 'Members can join the group themselves.' }),
  },
  outputSchema: heartbeatOutputSchemas.updatedGroup,
  async run({ auth, propsValue }) {
    const groupId = heartbeatApi.uuid({ value: propsValue.groupId, label: 'Group ID' });
    const changes = Object.fromEntries(
      Object.entries({
        name: heartbeatApi.optionalText(propsValue.name),
        description: heartbeatApi.optionalText(propsValue.description),
        isIsolated: heartbeatApi.triState(propsValue.isIsolated),
        isJoinable: heartbeatApi.triState(propsValue.isJoinable),
      }).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: set at least one field.');
    }
    await heartbeatApi.request({ token: auth.secret_text, method: HttpMethod.POST, path: `/groups/${groupId}`, operation: 'update group', body: changes });
    const lookup = await heartbeatApi.afterWrite({ what: 'the updated group', load: () => heartbeatGroups.getGroup({ token: auth.secret_text, groupId }) });
    return { id: groupId, updated: true, updatedFields: Object.keys(changes), group: lookup.value, lookupError: lookup.lookupError };
  },
});
