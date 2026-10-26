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
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ name?: string }>({
        method: HttpMethod.GET,
        url: `${INSTAGRAM_API_BASE}/me`,
        queryParams: { fields: 'name' },
        headers: { authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body.name || undefined;
    } catch {
      return undefined;
    }
  },
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
  return getPagesFrom({ accessToken, after: undefined });
}

async function getPagesFrom({
  accessToken,
  after,
}: GetPagesFromParams): Promise<FacebookPage[]> {
  const response = await graphRequest<{
    data?: FacebookPage[];
    paging?: GraphPaging;
  }>({
    method: HttpMethod.GET,
    resourceUri: '/me/accounts',
    accessToken,
    query: {
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      limit: 100,
      after,
    },
  });

  const pages = response.data ?? [];
  const nextAfter = nextCursor(response.paging);
  if (!nextAfter || nextAfter === after) {
    return pages;
  }

  return [...pages, ...(await getPagesFrom({ accessToken, after: nextAfter }))];
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
  deadline = Date.now() + CONTAINER_TIMEOUT_MS,
}: WaitForContainerParams): Promise<void> {
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
        `Instagram did not finish processing the media in time (status ${
          statusCode ?? 'unknown'
        }). The post was not published.`,
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

function nextCursor(paging: GraphPaging | undefined): string | undefined {
  return paging?.next ? paging.cursors?.after : undefined;
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
  publishContainer,
  publishMedia,
  requirePageId,
  nextCursor,
  createPhotoPost,
  createVideoPost,

  page: Property.Dropdown<FacebookPageDropdown, true, typeof instagramBusinessAuth>({
    auth: instagramBusinessAuth,
    displayName: 'Facebook Page',
    description: 'Uses the Instagram account linked to this Page.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account first',
        };
      }

      const accessToken = getAccessTokenOrThrow(auth);
      const pages = await getPages(accessToken);
      const options = pages
        .filter((page) => page.instagram_business_account !== undefined)
        .map((page) => ({
          label: page.instagram_business_account.username
            ? `${page.name} (@${page.instagram_business_account.username})`
            : page.name,
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
          placeholder: 'No Page with a linked Instagram account',
        };
      }

      return {
        options,
        placeholder: 'Select a Facebook Page',
      };
    },
  }),

  caption: Property.LongText({
    displayName: 'Caption',
    description: 'Up to 2,200 characters, including hashtags and mentions.',
    placeholder: 'Summer collection is live! #newarrivals',
    required: false,
  }),

  cursor: Property.ShortText({
    displayName: 'Cursor',
    description: 'The Next Cursor from an earlier run, to get the next results.',
    required: false,
    advanced: true,
  }),

  photo: Property.ShortText({
    displayName: 'Photo URL',
    description: 'Public link to a JPG image.',
    placeholder: 'https://example.com/photo.jpg',
    required: true,
  }),

  video: Property.ShortText({
    displayName: 'Video URL',
    description: 'Public link to the video, up to 1 GB and 15 minutes long.',
    placeholder: 'https://example.com/reel.mp4',
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

export const CAROUSEL_ALBUM_TIMEOUT_MS = 2 * 60 * 1000;

export function parseArrayProp(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  return [];
}

export type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: {
    id: string;
    username?: string;
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

type GetPagesFromParams = {
  accessToken: string;
  after: string | undefined;
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
  deadline?: number;
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

export type GraphPaging = {
  next?: string;
  cursors?: { after?: string };
};
