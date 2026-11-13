import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatChannels } from '../common/channels';

export const listChannelsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_channels',
  classification: 'SEARCH',
  displayName: 'List Channels',
  description: 'Lists the channels in the community, optionally only one type.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every channel (ID, name, emoji and type: POSTS for threads, CHAT for chat, VOICE for voice), optionally only one type. Use to get a channel ID for Create Thread, Send Channel Chat Message or List Threads. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Posts (threads)', value: 'POSTS' },
          { label: 'Chat', value: 'CHAT' },
          { label: 'Voice', value: 'VOICE' },
        ],
      },
    }),
  },
  outputSchema: heartbeatOutputSchemas.channelList,
  async run({ auth, propsValue }) {
    const type = heartbeatApi.optionalText(propsValue.type);
    if (type !== undefined && !CHANNEL_TYPES.includes(type)) {
      throw new Error(`Type must be one of ${CHANNEL_TYPES.join(', ')}.`);
    }
    const channels = (await heartbeatChannels.listChannels({ token: auth.secret_text })).filter(
      (channel) => type === undefined || channel['type'] === type,
    );
    return { channels, count: channels.length };
  },
});

const CHANNEL_TYPES = ['POSTS', 'CHAT', 'VOICE'];
