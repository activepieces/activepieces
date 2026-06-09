import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';

export const discordDeleteChannel = createAction({
  auth: discordAuth,
  name: 'delete_channel',
  description: 'delete a channel',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a channel, identified by channel ID. Use to remove a channel and its messages; this is destructive and cannot be undone. Requires the bot to have Manage Channels permission; idempotent in end state, since deleting an already-removed channel leaves it gone.', idempotent: true },
  displayName: 'Delete channel',
  props: {
    channel_id: discordCommon.channel,
  },

  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
