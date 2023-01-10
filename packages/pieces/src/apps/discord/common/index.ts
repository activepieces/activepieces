import {
  AuthPropertyValue,
  Property,
} from '../../../framework/property/prop.model';
import { HttpRequest } from '../../../common/http/core/http-request';
import { HttpMethod } from '../../../common/http/core/http-method';
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';

export const discordCommon = {
  baseUrl: 'https://discord.com/api',
  authentication: Property.OAuth2({
    displayName: 'Authentication',
    required: true,
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scope: ['bot'],
    extra: {
      // Admin
      permissions: 8,
    },
  }),
  bot_token: Property.ShortText({
    displayName: 'Bot token',
    required: true,
  }),
  channel: Property.Dropdown({
    displayName: 'Channel',
    required: true,
    refreshers: ['authentication', 'bot_token'],
    options: async (value) => {
      if (
        value['authentication'] === undefined ||
        value['bot_token'] === undefined
      ) {
        return {
          disabled: true,
          placeholder: 'connect discord account and bot token',
          options: [],
        };
      }
      const authentication: AuthPropertyValue = value[
        'authentication'
      ] as AuthPropertyValue;
      const guildId = authentication['data']['guild']['id'];
      const request: HttpRequest<never> = {
        method: HttpMethod.GET,
        url: `${discordCommon.baseUrl}/guilds/${guildId}/channels`,
        headers: {
          Authorization: `Bot ${value['bot_token']}`,
        },
      };
      const { body: channels } = await httpClient.sendRequest<
        { id: string; name: string }[]
      >(request);
      return {
        disabled: false,
        placeholder: 'Select channel',
        options: channels.map((ch) => {
          return {
            label: ch.name,
            value: ch.id,
          };
        }),
      };
    },
  }),
};
