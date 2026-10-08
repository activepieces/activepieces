import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const deleteChannelAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_delete_channel',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Channel',
  description: 'Permanently deletes a channel and all its threads.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a channel together with its threads or chat messages. Use only when the user explicitly asks; this cannot be undone. A repeat call finds it gone and reports alreadyDeleted=true, so it is idempotent.',
    idempotent: true,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'Use List Channels to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.deleted,
  async run({ auth, propsValue }) {
    const channelId = heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' });
    try {
      await heartbeatApi.request({ token: auth.secret_text, method: HttpMethod.DELETE, path: `/channels/${channelId}`, operation: 'delete channel' });
      return { id: channelId, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (heartbeatApi.statusOf(error) === 404) {
        return { id: channelId, deleted: true, alreadyDeleted: true };
      }
      throw error;
    }
  },
});
