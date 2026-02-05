import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';


export const oktaAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Okta Domain',
      description: 'Your Okta organization domain (e.g., https://dev-12345.okta.com or dev-12345.okta.com)',
      required: true,
    }),
    apiToken: Property.ShortText({
      displayName: 'API Token',
      description: 'Your Okta API token (from Admin → Security → API → Tokens)',
      required: true,
    }),
  },
});

export async function makeOktaRequest(
  auth: any,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const apiToken = auth.apiToken;
  let domain = auth.domain;
  
  if (!domain) {
    throw new Error('Okta domain is required');
  }
  
  if (!domain.startsWith('https://') && !domain.startsWith('http://')) {
    domain = `https://${domain}`;
  }
  domain = domain.replace(/\/$/, '');

  return await httpClient.sendRequest({
    method,
    url: `${domain}/api/v1${endpoint}`,
    headers: {
      'Authorization': `SSWS ${apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });
}

export const userIdDropdown = (groupusers = false) =>
  Property.Dropdown({
    auth: oktaAuth,
    displayName: 'User',
    description: 'Select a user',
    required: true,
    refreshers: ['auth', 'groupId'],
    options: async ({ auth, groupId }) => {
      try {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'select auth first',
          };
        }
        if (groupusers && !groupId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please select groupId first',
          };
        }
        const path = groupusers
          ? `/groups/${groupId}/users`
          : '/users';
        const response = await makeOktaRequest(
          auth,
          path,
          HttpMethod.GET,
          undefined
        );

        const users = await response.body;
        console.log(JSON.stringify(users, null, 2));
        if (!Array.isArray(users)) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No users found',
          };
        }
        return {
          disabled: false,
          options: users.map((user: any) => ({
            label:
              user.profile.firstName +
              ' ' +
              user.profile.lastName +
              ' (' +
              user.profile.email +
              ')',
            value: user.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching users',
        };
      }
    },
  });

export const groupIdDropdown = 
  Property.Dropdown({
    auth: oktaAuth,
    displayName: 'Group',
    description: 'Select a group',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      try {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No groups found',
          };
        }
        const response = await makeOktaRequest(
          auth,
          '/groups',
          HttpMethod.GET
        );

        const groups = await response.body;
        if (!Array.isArray(groups)) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No groups found',
          };
        }
        return {
          disabled: false,
          options: groups.map((group: any) => ({
            label: group.profile.name,
            value: group.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching groups',
        };
      }
    },
  });
