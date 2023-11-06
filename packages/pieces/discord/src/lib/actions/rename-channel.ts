import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { discordCommon } from '../common';

export const discordRenameChannel = createAction({
  auth: discordAuth,
  name: 'rename_channel',
  description: 'rename a channel',
  displayName: 'Rename channel',
  props: {
    channel_id: discordCommon.channel,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name of the channel',
      required: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PATCH,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}`,
      body: {
        name: configValue.propsValue.name,
      },
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return {
      success: res.status === 204,
    };
  },
});
