import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatChannels } from '../common/channels';

export const updateChannelAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_update_channel',
  classification: 'WRITE',
  displayName: 'Update Channel',
  description: "Changes a channel's name, description, read-only setting or who can access it.",
  audience: 'both',
  aiMetadata: {
    description: "Changes a channel's name, description, read-only setting or access: 'public' opens it to everyone, 'restricted' limits it to the given emails and group IDs (replacing the previous list). Omitted fields stay as they are; a call with nothing to change is refused. Applying the same values again changes nothing, so it is idempotent.",
    idempotent: true,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'Use List Channels to find the ID.', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    isReadOnly: heartbeatProps.triState({ displayName: 'Read Only', description: 'Only admins and moderators can post threads. Not available for chat channels.' }),
    access: Property.StaticDropdown({
      displayName: 'Access',
      required: false,
      defaultValue: 'unchanged',
      options: {
        disabled: false,
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Public (everyone)', value: 'public' },
          { label: 'Restricted to the emails and groups below', value: 'restricted' },
        ],
      },
    }),
    invitedEmails: heartbeatProps.emails({ displayName: 'Allowed Member Emails', description: 'Used when Access is Restricted. Replaces the current list.', required: false }),
    invitedGroupIds: heartbeatProps.ids({ displayName: 'Allowed Group IDs', description: 'Used when Access is Restricted. Replaces the current list.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.updatedChannel,
  async run({ auth, propsValue }) {
    const channelId = heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' });
    const access = propsValue.access ?? 'unchanged';
    if (!['unchanged', 'public', 'restricted'].includes(access)) {
      throw new Error('Access must be unchanged, public or restricted.');
    }
    const invitedUsers = heartbeatApi.emailList({ value: propsValue.invitedEmails, label: 'Allowed Member Emails' });
    const invitedGroups = heartbeatApi.uuidList({ value: propsValue.invitedGroupIds, label: 'Allowed Group IDs' });
    if (access !== 'restricted' && (invitedUsers.length > 0 || invitedGroups.length > 0)) {
      throw new Error('Allowed emails and groups are only used when Access is Restricted.');
    }
    if (access === 'restricted' && invitedUsers.length === 0 && invitedGroups.length === 0) {
      throw new Error('Access Restricted needs at least one allowed email or group ID.');
    }
    const changes: Record<string, unknown> = Object.fromEntries(
      Object.entries({
        name: heartbeatApi.optionalText(propsValue.name),
        description: heartbeatApi.optionalText(propsValue.description),
        isReadOnly: heartbeatApi.triState(propsValue.isReadOnly),
      }).filter(([, value]) => value !== undefined),
    );
    const body = access === 'public'
      ? { ...changes, restrictedTo: null }
      : access === 'restricted'
        ? { ...changes, restrictedTo: { invitedUsers, invitedGroups } }
        : changes;
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: set at least one field or change Access.');
    }
    await heartbeatApi.request({ token: auth.secret_text, method: HttpMethod.POST, path: `/channels/${channelId}`, operation: 'update channel', body });
    const lookup = await heartbeatApi.afterWrite({ what: 'the updated channel', load: () => heartbeatChannels.findChannel({ token: auth.secret_text, channelId }) });
    return { id: channelId, updated: true, updatedFields: Object.keys(body), channel: lookup.value, lookupError: lookup.lookupError };
  },
});
