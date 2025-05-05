import { medullarAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addSpaceRecord = createAction({
  auth: medullarAuth,
  name: 'addSpaceRecord',
  displayName: 'Add Space Record',
  description: 'Adds a Record into a Space',
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
        
        const userResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.medullar.com/auth/v1/users/me/',
          headers: {
            Authorization: `Bearer ${authentication}`,
          },
        });

        const userData = userResponse.body;

        const spaceListResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.medullar.com/explorator/v1/spaces/?user=${userData.uuid}&limit=1000&offset=0`,
          headers: {
            Authorization: `Bearer ${authentication}`,
          },
        });

        return {
          disabled: false,
          options: spaceListResponse.body.results.flat().map((list: { name: string; uuid: string }) => {
            return {
              label: list.name,
              value: list.uuid,
            };
          }),
        };
      },
    }),
    source_type: Property.StaticDropdown({
      displayName: 'Source Type',
      description: 'Select source type',
      required: true,
      options: {
        options: [
          {
            label: 'URL',
            value: 'url',
          },
          {
            label: 'Text',
            value: 'text',
          },
          {
            label: 'Image',
            value: 'image',
          },
          {
            label: 'File',
            value: 'file',
          },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Optional. Content of the record',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Optional. URL of the record',
      required: false,
    }),
  },
  async run(context) {
    const userResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.medullar.com/auth/v1/users/me/',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    const userData = userResponse.body;

    if (!userData) {
      throw new Error('User data not found.');
    }

    if (!userData.company) {
      throw new Error('User does not belong to any company.');
    }

    let url = ' '
    let content = ' '
    if (context.propsValue['url'] != null) url = context.propsValue['url']
    if (context.propsValue['content'] != null) content = context.propsValue['content']

    const spaceResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.medullar.com/explorator/v1/records/',
      body: {
        spaces: [
          {
            uuid: context.propsValue['space_uuid'],
          },
        ],
        company: {
          uuid: userData.company.uuid,
        },
        user: {
          uuid: userData.uuid,
        },
        source: context.propsValue['source_type'],
        data: {
          content: content,
          url: url,
        }
      },
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return spaceResponse.body;
  },
});
