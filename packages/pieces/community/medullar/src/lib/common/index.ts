import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { medullarAuth } from '../..';

export const medullarCommon = {
  baseUrl: 'https://api.medullar.com',
  authUrl: 'https://api.medullar.com/auth/v1',
  exploratorUrl: 'https://api.medullar.com/explorator/v1',
  aiUrl: 'https://api.medullar.com/ai/v1',
};

export async function getUser(authentication: AppConnectionValueForAuthProperty<typeof medullarAuth>) {
  const userResponse = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${medullarCommon.authUrl}/users/me/`,
    headers: {
      Authorization: `Bearer ${authentication}`,
    },
  });

  const userData = userResponse.body;

  if (!userData) {
    throw new Error('User data not found.');
  }

  if (!userData.company) {
    throw new Error('User does not belong to any company.');
  }

  return userData;
}

export async function getUserSpaces(authentication: AppConnectionValueForAuthProperty<typeof medullarAuth>) {
  const userData = await getUser(authentication);

  const spaceListResponse = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${medullarCommon.aiUrl}/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
    headers: {
      Authorization: `Bearer ${authentication.secret_text}`,
    },
  });

  return spaceListResponse.body.results;
}

export const medullarPropsCommon = {
  spaceId: Property.Dropdown<{ name: string; uuid: string },true,typeof medullarAuth>({
    auth: medullarAuth,
    displayName: 'Space',
    description: 'Select an Space',
    required: true,
    refreshers: ['auth'],
    refreshOnSearch: false,
    options: async ({ auth }) => {
      const authentication = auth;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }

      const spaceListResponse = await getUserSpaces(authentication);

      return {
        disabled: false,
        options: spaceListResponse
          .flat()
          .map((list: { name: string; uuid: string }) => {
            return {
              label: list.name,
              value: list.uuid,
            };
          }),
      };
    },
  }),
  chatId: Property.Dropdown<{ name: string; uuid: string },false,typeof medullarAuth>({
    auth: medullarAuth,
    displayName: 'Chat',
    description:
      'Optional. Select a Chat where messages will be stored, if not selected, a default chat will be created with the name `automated`',
    required: false,
    refreshers: ['auth', 'spaceId'],
    refreshOnSearch: false,
    options: async ({ auth, spaceId }) => {
      const authentication = auth;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }

      if (!spaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a Space first',
        };
      }

      const chatListResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${medullarCommon.aiUrl}/chats/?space=${spaceId}&limit=1000&offset=0`,
        headers: {
          Authorization: `Bearer ${authentication}`,
        },
      });

      return {
        disabled: false,
        options: chatListResponse.body.results
          .flat()
          .map((list: { name: string; uuid: string }) => {
            return {
              label: list.name,
              value: list.uuid,
            };
          }),
      };
    },
  }),
};
