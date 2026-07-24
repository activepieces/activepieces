import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

interface Emoji {
  id: string | null;
  name: string | null;
  animated?: boolean;
}

export const discordListEmojis = createAction({
  auth: discordAuth,
  name: 'discord_list_emojis',
  displayName: 'List Emojis',
  description: 'List a guild\'s custom emojis.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists a guild's custom emojis by guild ID (GET /guilds/{guild_id}/emojis), returning each emoji's id and name. Use this to build the name:id string required by Add Reaction / Remove Reaction for custom emojis. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    guild_id: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The numeric guild (server) ID.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/emojis`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<Emoji[]>(request);
      const emojis = (res.body ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        animated: e.animated ?? false,
        // Ready-to-use reaction string for custom emoji: name:id
        reaction_string: e.id && e.name ? `${e.name}:${e.id}` : e.name,
      }));
      return { emojis, count: emojis.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks access to this guild.'
        );
      }
      if (status === 404) {
        throw new Error('Guild not found (404). Verify the guild_id.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
