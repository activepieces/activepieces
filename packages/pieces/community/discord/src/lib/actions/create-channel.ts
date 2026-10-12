import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { discordCommon } from '../common';
import { discordCreateChannelActionOutputSchema } from '../output-schemas';

export const discordCreateChannel = createAction({
  auth: discordAuth,
  name: 'create_channel',
  classification: 'WRITE',
  description: 'Create a text channel in a server.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new channel in a guild with the given name and optional topic, identified by guild ID. Use to provision a channel before posting to it. Requires the bot to have Manage Channels permission; not idempotent, since each call creates a separate channel even with the same name.', idempotent: false },
  displayName: 'Create Channel',
  outputSchema: discordCreateChannelActionOutputSchema,
  props: {
    guild_id: discordCommon.guilds,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Discord lowercases the name and turns spaces into dashes.',
      placeholder: 'project-updates',
      required: true,
    }),
    topic: Property.LongText({
      displayName: 'Topic',
      description: 'Shown at the top of the channel.',
      required: false,
      advanced: true,
    }),
  },

  async run(configValue) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/channels`,
      body: {
        name: configValue.propsValue.name,
        topic: configValue.propsValue.topic,
      },
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest(request);

    return {
      success: res.status === 201,
      channel: {
        id: res.body.id,
        name: res.body.name,
      },
    };
  },
});
