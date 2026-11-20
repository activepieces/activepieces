import { HttpError, HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { Channel, Guild, Role } from '../common/models';
import { AppConnectionValueForAuthProperty, Property, isNil, tryCatch } from '@activepieces/pieces-framework';
import { discordAuth } from '../auth';

const MESSAGE_CHANNEL_TYPES = [0, 2, 5, 13];
const GUILDS_PAGE_SIZE = 200;
const MAX_RATE_LIMIT_RETRIES = 3;

export const channelNotFoundMessage = (name: string) =>
  `No channel named "${name}" was found. Either it does not exist, or the bot lacks the View Channel permission on it (Discord hides those channels from the bot). Check the name, or grant the bot's role View Channel on that channel.`;

export const discordCommon = {
  baseUrl: 'https://discord.com/api/v9',
  channel: channelDropdown({ channelTypes: null }),
  messageChannel: channelDropdown({ channelTypes: MESSAGE_CHANNEL_TYPES }),
  sendWithRateLimitRetry,
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

      const guilds = await listAllGuilds({ auth });

      if (guilds.length === 0)
        return {
          disabled: true,
          options: [],
          placeholder: 'No servers found, add the bot to a server first',
        };

      return {
        options: guilds.map((guild) => ({
          value: guild.id,
          label: guild.name,
        })),
      };
    },
  }),
};

function channelDropdown({ channelTypes }: { channelTypes: number[] | null }) {
  return Property.Dropdown({
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

            return resChannels.body
              .filter((channel) => channelTypes === null || channelTypes.includes(channel.type))
              .map((channel) => ({
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
  });
}

async function listAllGuilds({
  auth,
  after,
}: {
  auth: AppConnectionValueForAuthProperty<typeof discordAuth>;
  after?: string;
}): Promise<Guild[]> {
  const res = await sendWithRateLimitRetry<Guild[]>({
    request: {
      method: HttpMethod.GET,
      url: 'https://discord.com/api/v9/users/@me/guilds',
      queryParams: {
        limit: String(GUILDS_PAGE_SIZE),
        ...(after ? { after } : {}),
      },
      headers: {
         Authorization: 'Bot ' + auth.secret_text,
      },
    },
  });
  if (res.body.length < GUILDS_PAGE_SIZE) {
    return res.body;
  }
  const rest = await listAllGuilds({ auth, after: res.body[res.body.length - 1].id });
  return [...res.body, ...rest];
}

async function sendWithRateLimitRetry<T>({
  request,
  attempt = 0,
}: {
  request: HttpRequest;
  attempt?: number;
}): Promise<HttpResponse<T>> {
  const { data, error } = await tryCatch(() => httpClient.sendRequest<T>(request));
  if (error === null) {
    return data;
  }
  const retryAfterSeconds = rateLimitRetryAfterSeconds(error);
  if (isNil(retryAfterSeconds) || attempt >= MAX_RATE_LIMIT_RETRIES) {
    throw error;
  }
  await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
  return sendWithRateLimitRetry<T>({ request, attempt: attempt + 1 });
}

function rateLimitRetryAfterSeconds(error: Error): number | null {
  if (!(error instanceof HttpError) || error.response.status !== 429) {
    return null;
  }
  const body = error.response.body;
  if (typeof body === 'object' && body !== null && 'retry_after' in body && typeof body.retry_after === 'number') {
    return body.retry_after;
  }
  return 1;
}
