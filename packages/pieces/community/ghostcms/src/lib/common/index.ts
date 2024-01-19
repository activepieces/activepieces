import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import jwt from 'jsonwebtoken';

export const common = {
  properties: {
    newsletters: (required = true) => {
      return Property.MultiSelectDropdown({
        displayName: 'Newsletters',
        required: required,
        refreshers: [],
        options: async ({ auth }) => {
          if (!auth) {
            return {
              disabled: true,
              placeholder: 'Connect your account',
              options: [],
            };
          }

          const newsletters = (
            (await common.getNewsletters(auth)) as { newsletters: any[] }
          ).newsletters.map((newsletter: any) => {
            return {
              label: newsletter.name,
              value: newsletter.id,
            };
          });
          return {
            options: newsletters,
          };
        },
      });
    },
    member: (required = true) => {
      return Property.Dropdown({
        displayName: 'Member',
        required: required,
        refreshers: [],
        options: async ({ auth }) => {
          if (!auth) {
            return {
              disabled: true,
              placeholder: 'Connect your account',
              options: [],
            };
          }

          const members = (
            (await common.getMembers(auth)) as { members: any[] }
          ).members.map((member: any) => {
            return {
              label: member.name ?? member.email,
              value: member.id,
            };
          });
          return {
            options: members,
          };
        },
      });
    },
    author: Property.Dropdown({
      displayName: 'Author',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account',
            options: [],
          };
        }

        const authors: any[] = (
          (await common.getUsers(auth)) as { users: any[] }
        ).users.map((user: any) => {
          return {
            label: user.name ?? user.email,
            value: user.email,
          };
        });
        return {
          options: authors,
        };
      },
    }),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account',
            options: [],
          };
        }

        const tags: any[] = (
          (await common.getTags(auth)) as { tags: any[] }
        ).tags.map((tag: any) => {
          return {
            label: tag.name,
            value: tag.name,
          };
        });
        return {
          options: tags,
        };
      },
    }),
  },

  jwtFromApiKey: (apiKey: string) => {
    const [id, secret] = apiKey.split(':');

    return jwt.sign({}, Buffer.from(secret, 'hex'), {
      keyid: id,
      expiresIn: '5m',
      audience: '/admin/',
    });
  },

  async subscribeWebhook(auth: any, webhookType: string, webhookUrl: string) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/webhooks`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
      body: {
        webhooks: [
          {
            target_url: webhookUrl,
            event: webhookType,
          },
        ],
      },
    });

    return response.body;
  },

  async unsubscribeWebhook(auth: any, webhookId: string) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/webhooks/${webhookId}`,
      method: HttpMethod.DELETE,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
    });

    return response.body;
  },

  async getNewsletters(auth: any) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/newsletters`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
    });

    return response.body;
  },

  async getMembers(auth: any) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/members`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
    });

    return response.body;
  },

  async getUsers(auth: any) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/users`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
    });

    return response.body;
  },

  async getTags(auth: any) {
    const response = await httpClient.sendRequest({
      url: `${auth.baseUrl}/ghost/api/admin/tags`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(auth.apiKey)}`,
      },
    });

    return response.body;
  },
};
