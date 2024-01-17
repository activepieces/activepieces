import {
  HttpMethod,
  httpClient,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

const markdown = `
To Obtain the following credentials:
1. Visit https://developers.facebook.com/
2. Create an application, Select Other for Usecase.
3. Select Business as App Type.
4. Copy App Id and App Secret from Basic Settings.
`;

export const instagramCommon = {
  baseUrl: 'https://graph.facebook.com/v17.0',

  authentication: PieceAuth.OAuth2({
    description: markdown,
    authUrl: 'https://graph.facebook.com/oauth/authorize',
    tokenUrl: 'https://graph.facebook.com/oauth/access_token',
    required: true,
    scope: ['instagram_basic', 'instagram_content_publish', 'business_management', 'pages_show_list'],
  }),

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

      const accessToken: string = getAccessTokenOrThrow(
        auth as OAuth2PropertyValue
      );
      const pages: any[] = (await instagramCommon.getPages(accessToken))
        .map((page: FacebookPage) => {
          if (!page.instagram_business_account) {
            return null;
          }
          return {
            label: page.name,
            value: {
              id: page.instagram_business_account.id,
              accessToken: page.access_token,
            },
          };
        })
        .filter((f: unknown) => f !== null);

      return {
        options: pages,
        placeholder: 'Choose a page',
      };
    },
  }),

  caption: Property.LongText({
    displayName: 'Caption',
    required: false,
  }),
  photo: Property.ShortText({
    displayName: 'Photo',
    description: 'A URL we can access for the photo (JPG only)',
    required: true,
  }),

  video: Property.ShortText({
    displayName: 'Video',
    description: 'A URL we can access for the video (Limit: 1GB or 15 minutes)',
    required: true,
  }),

  getPages: async (accessToken: string) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${instagramCommon.baseUrl}/me/accounts`,
      queryParams: {
        access_token: accessToken,
        fields: 'id,name,access_token,instagram_business_account',
      },
    });

    return response.body.data;
  },

  createPhotoPost: async (
    page: FacebookPageDropdown,
    caption: string | undefined,
    photo: string
  ) => {
    const createContainerRequest = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${instagramCommon.baseUrl}/${page.id}/media`,
      body: {
        access_token: page.accessToken,
        image_url: photo,
        caption: caption,
      },
    });

    const publishContainerRequest = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${instagramCommon.baseUrl}/${page.id}/media_publish`,
      body: {
        access_token: page.accessToken,
        creation_id: createContainerRequest.body.id,
      },
    });

    return publishContainerRequest.body;
  },

  createVideoPost: async (
    page: FacebookPageDropdown,
    caption: string | undefined,
    video: string
  ) => {
    const createContainerRequest = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${instagramCommon.baseUrl}/${page.id}/media`,
      body: {
        access_token: page.accessToken,
        video_url: video,
        caption: caption,
        media_type: 'REELS',
      },
    });

    const isUploaded = await isUploadSuccessful(
      createContainerRequest.body.id,
      page.accessToken,
      0
    );

    if (isUploaded) {
      const publishContainerRequest = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${instagramCommon.baseUrl}/${page.id}/media_publish`,
        body: {
          access_token: page.accessToken,
          creation_id: createContainerRequest.body.id,
        },
      });

      return publishContainerRequest.body;
    } else {
      return false;
    }
  },
};

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: {
    id: string;
  };
}

export interface FacebookPageDropdown {
  id: string;
  accessToken: string;
}

async function isUploadSuccessful(
  containerId: string,
  accessToken: string,
  retryCount: number
): Promise<boolean> {
  if (retryCount > 20) return false;

  const request = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${instagramCommon.baseUrl}/${containerId}`,
    queryParams: {
      access_token: accessToken,
      fields: 'status_code',
    },
  });

  if (request.body.status_code != 'FINISHED') {
    await _wait(5000);
    return await isUploadSuccessful(containerId, accessToken, retryCount + 1);
  } else {
    return true;
  }
}

function _wait(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n));
}
