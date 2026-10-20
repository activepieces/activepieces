import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatChannels } from '../common/channels';

export const createChannelAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_channel',
  classification: 'WRITE',
  displayName: 'Create Channel',
  description: 'Creates a posts (threads) or chat channel in a category.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a posts (threads) or chat channel in a channel category, public or private (private: only the invited emails and group IDs can see it), and returns its ID. Get the category ID from List Channel Categories. Not idempotent: each call creates another channel.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    channelCategoryId: heartbeatProps.id({ displayName: 'Channel Category ID', description: 'Use List Channel Categories to find the ID.', required: true }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      required: true,
      defaultValue: 'POSTS',
      options: {
        disabled: false,
        options: [
          { label: 'Posts (threads)', value: 'POSTS' },
          { label: 'Chat', value: 'CHAT' },
        ],
      },
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Private channels are only visible to the invited members and groups.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    invitedEmails: heartbeatProps.emails({ displayName: 'Invited Member Emails', description: 'Who can access a private channel.', required: false }),
    invitedGroupIds: heartbeatProps.ids({ displayName: 'Invited Group IDs', description: 'Groups that can access a private channel. Use List Groups to find IDs.', required: false }),
    isReadOnly: Property.Checkbox({ displayName: 'Read Only', description: 'Only admins and moderators can post threads. Not available for chat channels.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.createdChannel,
  async run({ auth, propsValue }) {
    if (propsValue.visibility !== 'public' && propsValue.visibility !== 'private') {
      throw new Error('Visibility must be public or private.');
    }
    if (propsValue.channelType !== 'POSTS' && propsValue.channelType !== 'CHAT') {
      throw new Error('Channel Type must be POSTS or CHAT.');
    }
    if (propsValue.isReadOnly === true && propsValue.channelType === 'CHAT') {
      throw new Error('Read Only is not available for chat channels.');
    }
    const name = heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' });
    const created = await heartbeatApi.request<unknown>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/channels',
      operation: 'create channel',
      body: {
        name,
        description: heartbeatApi.optionalText(propsValue.description),
        isPrivate: propsValue.visibility === 'private',
        channelCategoryID: heartbeatApi.uuid({ value: propsValue.channelCategoryId, label: 'Channel Category ID' }),
        channelType: propsValue.channelType,
        invitedUsers: heartbeatApi.listOrUndefined(heartbeatApi.emailList({ value: propsValue.invitedEmails, label: 'Invited Member Emails' })),
        invitedGroups: heartbeatApi.listOrUndefined(heartbeatApi.uuidList({ value: propsValue.invitedGroupIds, label: 'Invited Group IDs' })),
        isReadOnly: propsValue.isReadOnly ?? undefined,
      },
    });
    const channelId = heartbeatApi.isRecord(created) ? created['channelID'] : undefined;
    if (typeof channelId !== 'string') {
      throw new Error('Heartbeat created the channel but did not return its ID. Use List Channels to find it.');
    }
    const lookup = await heartbeatApi.afterWrite({
      what: 'the new channel',
      load: () => heartbeatChannels.findChannel({ token: auth.secret_text, channelId }),
    });
    return { ...(lookup.value ?? { id: channelId, name, type: propsValue.channelType }), lookupError: lookup.lookupError };
  },
});
