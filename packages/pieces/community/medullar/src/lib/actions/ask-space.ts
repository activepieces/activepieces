import { createAction, Property } from '@activepieces/pieces-framework';
import { medullarAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getUser, medullarCommon } from '../common';

export const askSpace = createAction({
  auth: medullarAuth,
  name: 'askSpace',
  displayName: 'Ask Space',
  description: 'Ask anything to a Space',
  props: {
    space_uuid: Property.Dropdown({
      displayName: 'Space',
      description: 'Select an Space',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const authentication = auth as string;
        if (!authentication) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }

        const userData = await getUser(authentication)

        const spaceListResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${medullarCommon.exploratorUrl}/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
          headers: {
            Authorization: `Bearer ${authentication}`,
          },
        });

        return {
          disabled: false,
          options: spaceListResponse.body.results
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
    chat_uuid: Property.Dropdown({
      displayName: 'Space',
      description: 'Optional. Select a Chat, if not selected, a default chat will be created with the name `automated`',
      required: false,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const authentication = auth as string;
        if (!authentication) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        
        const userData = await getUser(authentication)

        const spaceListResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${medullarCommon.exploratorUrl}/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
          headers: {
            Authorization: `Bearer ${authentication}`,
          },
        });

        return {
          disabled: false,
          options: spaceListResponse.body.results
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
  },
  async run() {
    // Action logic here
  },
});
