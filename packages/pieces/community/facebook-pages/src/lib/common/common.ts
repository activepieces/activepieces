import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { facebookPagesAuth } from '../auth';

async function graphRequest<T>({ accessToken, method, path, queryParams, body }: GraphRequest): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${GRAPH_API_URL}/${path}`,
    queryParams: compactQuery({ query: queryParams ?? {} }),
    body,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: accessToken },
  });
  return response.body;
}

async function pageRequest<T>({ auth, pageId, ...request }: PageRequest): Promise<T> {
  const accessToken = await getPageAccessToken({ auth, pageId });
  return graphRequest<T>({ accessToken, ...request });
}

async function getPageAccessToken({ auth, pageId }: { auth: OAuth2PropertyValue; pageId: string }): Promise<string> {
  const page = await graphRequest<{ access_token?: string }>({
    accessToken: auth.access_token,
    method: HttpMethod.GET,
    path: objectPath({ id: pageId }),
    queryParams: { fields: 'access_token' },
  });
  if (!page.access_token) {
    throw new Error(
      `No Page access token was returned for Page ${pageId}. The connected account needs a role on this Page; List Managed Pages shows the Pages it can use.`
    );
  }
  return page.access_token;
}

async function listAllPages({ accessToken }: { accessToken: string }): Promise<FacebookPage[]> {
  const pages: FacebookPage[] = [];
  let after: string | undefined;
  do {
    const response = await graphRequest<GraphList<FacebookPage>>({
      accessToken,
      method: HttpMethod.GET,
      path: 'me/accounts',
      queryParams: { fields: 'id,name,access_token', limit: '100', after },
    });
    pages.push(...(response.data ?? []));
    after = response.paging?.next ? response.paging.cursors?.after : undefined;
  } while (after);
  return pages;
}

function objectPath({ id }: { id: string }): string {
  return encodeURIComponent(id.trim());
}

function toCursorPage<T>({ response }: { response: GraphList<T> }) {
  const items = response.data ?? [];
  return {
    items,
    count: items.length,
    next_cursor: response.paging?.next ? response.paging.cursors?.after ?? null : null,
  };
}

function cursorQuery({ limit, after }: { limit?: number; after?: string }): Record<string, string | undefined> {
  return {
    limit: String(limit ?? 25),
    after: isProvided(after) ? after.trim() : undefined,
  };
}

function fieldsQuery({ fields, defaultFields }: { fields: unknown; defaultFields: string }): string {
  const requested = Array.isArray(fields)
    ? fields.filter((field): field is string => typeof field === 'string' && field.trim().length > 0).map((field) => field.trim())
    : [];
  return requested.length > 0 ? requested.join(',') : defaultFields;
}

function toScheduledUnixTime({ value }: { value: string }): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error('Scheduled Publish Time must be a valid ISO 8601 date and time.');
  }
  if (timestamp < Date.now() + MIN_SCHEDULE_LEAD_MS) {
    throw new Error('Scheduled Publish Time must be at least 10 minutes in the future.');
  }
  return Math.floor(timestamp / 1000);
}

function isProvided(value: string | undefined | null): value is string {
  return value !== undefined && value !== null && value.trim().length > 0;
}

function compactQuery({ query }: { query: Record<string, string | undefined> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
  );
}

export const facebookPagesCommon = {
  page: Property.Dropdown<FacebookPageDropdown, true, typeof facebookPagesAuth>({
    auth: facebookPagesAuth,
    displayName: 'Page',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account' };
      }
      const pages = await listAllPages({ accessToken: auth.access_token }).catch(() => null);
      if (pages === null) {
        return { disabled: true, options: [], placeholder: 'Could not load your Pages, reconnect your account' };
      }
      return {
        options: pages.map((page) => ({
          label: page.name,
          value: { id: page.id, accessToken: page.access_token },
        })),
        placeholder: 'Choose a page',
      };
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
  pageId: Property.ShortText({
    displayName: 'Page ID',
    description: 'Numeric ID of a Facebook Page the connected account manages. Find it with List Managed Pages.',
    required: true,
  }),
  postId: Property.ShortText({
    displayName: 'Post ID',
    description:
      'The post ID in PageID_PostID format, as returned in post_id by Create Page Photo Post, in id by Create Page Post, or by Get Page Posts. A photo or video ID is not a post ID.',
    required: true,
  }),
  limit: ({ max }: { max: number }) =>
    Property.Number({
      displayName: 'Limit',
      description: `Maximum number of items to return in this page (up to ${max}).`,
      required: false,
      defaultValue: 25,
    }),
  after: Property.ShortText({
    displayName: 'After Cursor',
    description: 'The next_cursor value from a previous call, to fetch the next page.',
    required: false,
  }),
  fields: ({ defaultFields }: { defaultFields: string }) =>
    Property.Array({
      displayName: 'Fields',
      description: `Graph API fields to return instead of the defaults (${defaultFields}).`,
      required: false,
    }),
  graphRequest,
  pageRequest,
  getPageAccessToken,
  objectPath,
  toCursorPage,
  cursorQuery,
  fieldsQuery,
  toScheduledUnixTime,
  isProvided,
};

const GRAPH_API_URL = 'https://graph.facebook.com/v23.0';
const MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000;

type GraphRequest = {
  accessToken: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};

type PageRequest = Omit<GraphRequest, 'accessToken'> & {
  auth: OAuth2PropertyValue;
  pageId: string;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
};

export type GraphList<T> = {
  data?: T[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
};

export type GraphRecord = Record<string, unknown>;

export type FacebookPageDropdown = {
  id: string;
  accessToken: string;
};
