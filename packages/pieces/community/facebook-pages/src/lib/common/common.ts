import {
  HttpMethod,
  httpClient,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

export const facebookPagesCommon = {
  baseUrl: 'https://graph.facebook.com/v17.0',
  page: Property.Dropdown<FacebookPageDropdown>({
    displayName: 'Page',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account',
        };
      }

      try {
        const accessToken: string = getAccessTokenOrThrow(
          auth as OAuth2PropertyValue
        );
        const pages: any[] = (
          await facebookPagesCommon.getPages(accessToken)
        ).map((page: FacebookPage) => {
          return {
            label: page.name,
            value: {
              id: page.id,
              accessToken: page.access_token,
            },
          };
        });

        return {
          options: pages,
          placeholder: 'Choose a page',
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account',
        };
      }
    },
  }),

  message: Property.LongText({
    displayName: 'Message',
    required: true,
  }),
  link: Property.ShortText({
    displayName: 'Link',
    required: false,
  }),

  caption: Property.LongText({
    displayName: 'Caption',
    required: false,
  }),
  photo: Property.ShortText({
    displayName: 'Photo',
    description: 'A URL we can access for the photo',
    required: true,
  }),

  title: Property.ShortText({
    displayName: 'Title',
    required: false,
  }),
  description: Property.LongText({
    displayName: 'Description',
    required: false,
  }),
  video: Property.ShortText({
    displayName: 'Video',
    description: 'A URL we can access for the video (Limit: 1GB or 20 minutes)',
    required: true,
  }),

  getPages: async (accessToken: string) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${facebookPagesCommon.baseUrl}/me/accounts?access_token=${accessToken}`,
    });

    return response.body.data;
  },

  createPost: async (
    page: FacebookPageDropdown,
    message: string,
    link: string | undefined
  ) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${facebookPagesCommon.baseUrl}/${page.id}/feed`,
      body: {
        access_token: page.accessToken,
        message: message,
        link: link,
      },
    });
    return response.body;
  },
  createPhotoPost: async (
    page: FacebookPageDropdown,
    caption: string | undefined,
    photo: string
  ) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${facebookPagesCommon.baseUrl}/${page.id}/photos`,
      body: {
        access_token: page.accessToken,
        url: photo,
        caption: caption,
      },
    });

    return response.body;
  },

  createVideoPost: async (
    page: FacebookPageDropdown,
    title: string | undefined,
    description: string | undefined,
    video: string
  ) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${facebookPagesCommon.baseUrl}/${page.id}/videos`,
      body: {
        access_token: page.accessToken,
        title: title,
        description: description,
        file_url: video,
      },
    });

    return response.body;
  },
};

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  category_list: string[];
  access_token: string;
  tasks: string[];
}

export interface FacebookPageDropdown {
  id: string;
  accessToken: string;
}
