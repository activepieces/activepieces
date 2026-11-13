import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Channel, Guild, Role } from '../common/models';
import { Property } from '@activepieces/pieces-framework';
import { discordAuth } from '../auth';

export const channelNotFoundMessage = (name: string) =>
  `No channel named "${name}" was found. Either it does not exist, or the bot lacks the View Channel permission on it (Discord hides those channels from the bot). Check the name, or grant the bot's role View Channel on that channel.`;

export const discordCommon = {
  baseUrl: 'https://discord.com/api/v9',
  channel: Property.Dropdown({
    auth: discordAuth,
    displayName: 'Channel',
    description:
      'Channels from every server the bot has joined. Only channels where the bot has the View Channel permission are listed.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your bot first',
        };
      }

      const request = {
        method: HttpMethod.GET,
        url: 'https://discord.com/api/v9/users/@me/guilds',
        headers: {
           Authorization: 'Bot ' + auth.secret_text,
        },
      };

      const res = await httpClient.sendRequest<Guild[]>(request);

      if (res.body.length === 0)
        return {
          disabled: true,
          options: [],
          placeholder: 'No servers found, add the bot to a server first',
        };

      const options = (
        await Promise.all(
          res.body.map(async (guild) => {
            const requestChannels = {
              method: HttpMethod.GET,
              url:
                'https://discord.com/api/v9/guilds/' + guild.id + '/channels',
              headers: {
                 Authorization: 'Bot ' + auth.secret_text,
              },
            };

            const resChannels = await httpClient.sendRequest<Channel[]>(
              requestChannels
            );

            return resChannels.body.map((channel) => ({
              value: channel.id,
              label: `${channel.name} (${guild.name})`,
            }));
          })
        )
      ).flat();

      if (options.length === 0)
        return {
          disabled: true,
          options: [],
          placeholder:
            'No channels found. Make sure the bot has the View Channel permission on the channels you need.',
        };

      return { options };
    },
  }),
  roles: Property.Dropdown({
    auth: discordAuth,
    displayName: 'Role',
    description: 'Roles of the selected server.',
    required: true,
    refreshers: ['guild_id'],
    options: async ({ auth, guild_id }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your bot first',
        };
      }

      if (!guild_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a server first',
        };
      }

      const request = {
        method: HttpMethod.GET,
        url: `https://discord.com/api/v9/guilds/${guild_id}/roles`,
        headers: {
           Authorization: 'Bot ' + auth.secret_text,
        },
      };

      const res = await httpClient.sendRequest<Role[]>(request);

      if (res.body.length === 0)
        return {
          disabled: true,
          options: [],
          placeholder: 'No roles found in this server',
        };

      return {
        options: res.body.map((role) => ({
          value: role.id,
          label: role.name,
        })),
      };
    },
  }),
  guilds: Property.Dropdown({
    auth: discordAuth,
    displayName: 'Server',
    description: 'Only servers the bot has been added to are listed.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your bot first',
        };
      }

      const request = {
        method: HttpMethod.GET,
        url: 'https://discord.com/api/v9/users/@me/guilds',
        headers: {
           Authorization: 'Bot ' + auth.secret_text,
        },
      };

      const res = await httpClient.sendRequest<Guild[]>(request);

      if (res.body.length === 0)
        return {
          disabled: true,
          options: [],
          placeholder: 'No servers found, add the bot to a server first',
        };

      return {
        options: res.body.map((guild) => ({
          value: guild.id,
          label: guild.name,
        })),
      };
    },
  }),
};
