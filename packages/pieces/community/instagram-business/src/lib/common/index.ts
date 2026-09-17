import {
  HttpMethod,
  httpClient,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

const markdown = `
**Use the Facebook App ID and App Secret — not the Instagram ones.**

1. Visit https://developers.facebook.com/ and create an app.
2. Choose **Other** as the use case, then **Business** as the app type. Any other
   combination leaves the app without the Instagram permissions this piece requests.
3. Add the **Facebook Login for Business** product.
4. Copy the **App ID** and **App Secret** from **Settings → Basic**.

The Instagram product page shows a separate *Instagram app ID* and *Instagram app secret*.
Those belong to Instagram Login and will not work here — this piece uses Facebook Login.

Your Instagram account must be a Business or Creator account linked to a Facebook Page.
`;

const instagramBusinessAuth = PieceAuth.OAuth2({
  description: markdown,
  authUrl: 'https://graph.facebook.com/oauth/authorize',
  tokenUrl: 'https://graph.facebook.com/oauth/access_token',
  required: true,
  scope: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'instagram_manage_contents',
    'instagram_manage_messages',
    'business_management',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'pages_messaging',
  ],
});

async function graphRequest<T>({
  method,
  resourceUri,
  accessToken,
  query,
  body,
}: GraphRequestParams): Promise<T> {
  const queryParams: Record<string, string> = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        queryParams[key] = String(value);
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${INSTAGRAM_API_BASE}${resourceUri}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    queryParams,
    body,
  });

  return response.body;
}

async function getPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await graphRequest<{ data?: FacebookPage[] }>({
    method: HttpMethod.GET,
    resourceUri: '/me/accounts',
    accessToken,
    query: { fields: 'id,name,access_token,instagram_business_account' },
  });

  return response.data ?? [];
}

async function createContainer({
  page,
  body,
}: CreateContainerParams): Promise<string> {
  const container = await graphRequest<{ id?: string }>({
    method: HttpMethod.POST,
    resourceUri: `/${page.id}/media`,
    accessToken: page.accessToken,
    body,
  });

  if (!container.id) {
    throw new Error(
      'Instagram did not return a media container id. The media URL may not be publicly reachable.',
    );
  }

  return container.id;
}

async function waitForContainer({
  containerId,
  page,
}: WaitForContainerParams): Promise<void> {
  const deadline = Date.now() + CONTAINER_TIMEOUT_MS;

  for (;;) {
    const container = await graphRequest<{
      status_code?: string;
      status?: string;
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${containerId}`,
      accessToken: page.accessToken,
      query: { fields: 'status_code,status' },
    });

    const statusCode = container.status_code;
    if (statusCode === 'FINISHED') {
      return;
    }
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new Error(
        `Instagram could not process the media (status ${statusCode}): ${
          container.status ?? 'no further detail was returned'
        }`,
      );
    }
    if (Date.now() + CONTAINER_POLL_INTERVAL_MS >= deadline) {
      throw new Error(
        `Instagram was still processing the media after ${
          CONTAINER_TIMEOUT_MS / 1000
        } seconds (status ${statusCode ?? 'unknown'}). The post was not published.`,
      );
    }

    await wait(CONTAINER_POLL_INTERVAL_MS);
  }
}

async function publishContainer({
  containerId,
  page,
}: PublishContainerParams): Promise<PublishedMedia> {
  const published = await graphRequest<{ id?: string }>({
    method: HttpMethod.POST,
    resourceUri: `/${page.id}/media_publish`,
    accessToken: page.accessToken,
    body: { creation_id: containerId },
  });

  if (!published.id) {
    throw new Error('Instagram did not return a media id for the published post.');
  }

  return { id: published.id };
}

async function publishMedia({
  page,
  body,
}: PublishMediaParams): Promise<PublishedMedia> {
  const containerId = await createContainer({ page, body });
  await waitForContainer({ containerId, page });
  return publishContainer({ containerId, page });
}

async function createPhotoPost({
  page,
  caption,
  photo,
}: CreatePhotoPostParams): Promise<PublishedMedia> {
  return publishMedia({ page, body: { image_url: photo, caption } });
}

async function createVideoPost({
  page,
  caption,
  video,
}: CreateVideoPostParams): Promise<PublishedMedia> {
  return publishMedia({
    page,
    body: { video_url: video, caption, media_type: 'REELS' },
  });
}

function requirePageId(page: FacebookPageDropdown): string {
  if (!page.pageId) {
    throw new Error(
      'This step needs the Facebook Page id. Re-open the step and select the Page again to refresh it.',
    );
  }
  return page.pageId;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const instagramCommon = {
  authentication: instagramBusinessAuth,
  graphRequest,
  getPages,
  createContainer,
  waitForContainer,
  publishMedia,
  requirePageId,
  createPhotoPost,
  createVideoPost,

  page: Property.Dropdown<FacebookPageDropdown, true, typeof instagramBusinessAuth>({
    auth: instagramBusinessAuth,
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

      const accessToken = getAccessTokenOrThrow(auth);
      const pages = await getPages(accessToken);
      const options = pages
        .filter((page) => page.instagram_business_account !== undefined)
        .map((page) => ({
          label: page.name,
          value: {
            id: page.instagram_business_account.id,
            pageId: page.id,
            accessToken: page.access_token,
          },
        }));

      if (options.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'No Facebook Page with a linked Instagram professional account was found',
        };
      }

      return {
        options,
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
};

export const COMMENT_FIELDS =
  'id,text,timestamp,username,like_count,hidden,parent_id,media{id,media_type,permalink}';

export const MEDIA_FIELDS =
  'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,is_comment_enabled';

export const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v23.0';

export const CONTAINER_POLL_INTERVAL_MS = 5000;

export const CONTAINER_TIMEOUT_MS = 5 * 60 * 1000;

export type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: {
    id: string;
  };
};

export type FacebookPageDropdown = {
  id: string;
  pageId?: string;
  accessToken: string;
};

export type PublishedMedia = {
  id: string;
};

type GraphRequestParams = {
  method: HttpMethod;
  resourceUri: string;
  accessToken: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

type PublishMediaParams = {
  page: FacebookPageDropdown;
  body: Record<string, unknown>;
};

type CreateContainerParams = {
  page: FacebookPageDropdown;
  body: Record<string, unknown>;
};

type WaitForContainerParams = {
  containerId: string;
  page: FacebookPageDropdown;
};

type PublishContainerParams = {
  containerId: string;
  page: FacebookPageDropdown;
};

type CreatePhotoPostParams = {
  page: FacebookPageDropdown;
  caption: string | undefined;
  photo: string;
};

type CreateVideoPostParams = {
  page: FacebookPageDropdown;
  caption: string | undefined;
  video: string;
};
