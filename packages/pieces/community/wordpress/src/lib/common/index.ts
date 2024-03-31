import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
export type WordPressMedia = { id: string; title: { rendered: string } };

const PAGE_HEADER = 'x-wp-totalpages';

export const wordpressCommon = {
  featured_media_file: Property.File({
    displayName: 'Featured Media (URL)',
    required: false,
    description: 'URL of featured media',
  }),
  authors: Property.Dropdown({
    displayName: 'Authors',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      const connection = auth as PiecePropValueSchema<typeof wordpressAuth>;
      const websiteUrl = connection.website_url;
      if (!connection?.username || !connection?.password || !websiteUrl) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${websiteUrl.trim()}/wp-json/wp/v2/users`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: connection.username,
          password: connection.password,
        },
      };
      const response = await httpClient.sendRequest<
        { id: string; name: string }[]
      >(request);
      return {
        options: response.body.map((usr) => {
          return { value: usr.id, label: usr.name };
        }),
      };
    },
  }),
  async getPosts(params: {
    websiteUrl: string;
    username: string;
    password: string;
    authors: string | undefined;
    afterDate: string;
    page: number;
  }) {
    const queryParams: Record<string, string> = {
      orderby: 'date',
      order: 'desc',
      before: new Date().toISOString(),
      after: params.afterDate,
      page: params.page.toString(),
    };
    if (params.authors) {
      queryParams['author'] = params.authors;
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${params.websiteUrl}/wp-json/wp/v2/posts`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: params.username,
        password: params.password,
      },
      queryParams: queryParams,
    };
    const response = await httpClient.sendRequest<{ date: string }[]>(request);
    return {
      posts: response.body,
      totalPages:
        response.headers && response.headers[PAGE_HEADER]
          ? Number(response.headers[PAGE_HEADER])
          : 0,
    };
  },
  async getMedia(params: {
    websiteUrl: string;
    username: string;
    password: string;
    page: number;
  }) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${params.websiteUrl}/wp-json/wp/v2/media`,
      queryParams: {
        page: params.page.toString(),
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: params.username,
        password: params.password,
      },
    };
    const response = await httpClient.sendRequest<WordPressMedia[]>(request);
    return {
      media: response.body,
      totalPages:
        response.headers && response.headers[PAGE_HEADER]
          ? Number(response.headers[PAGE_HEADER])
          : 0,
    };
  },
  async getTags(params: {
    websiteUrl: string;
    username: string;
    password: string;
    page: number;
  }) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${params.websiteUrl}/wp-json/wp/v2/tags`,
      queryParams: {
        page: params.page.toString(),
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: params.username,
        password: params.password,
      },
    };
    const response = await httpClient.sendRequest<
      { id: string; name: string }[]
    >(request);
    return {
      tags: response.body,
      totalPages:
        response.headers && response.headers[PAGE_HEADER]
          ? Number(response.headers[PAGE_HEADER])
          : 0,
    };
  },
  async getCategories(params: {
    websiteUrl: string;
    username: string;
    password: string;
    page: number;
  }) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${params.websiteUrl}/wp-json/wp/v2/categories`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: params.username,
        password: params.password,
      },
      queryParams: {
        page: params.page.toString(),
      },
    };
    const response = await httpClient.sendRequest<
      { id: string; name: string }[]
    >(request);
    return {
      categories: response.body,
      totalPages:
        response.headers && response.headers[PAGE_HEADER]
          ? Number(response.headers[PAGE_HEADER])
          : 0,
    };
  },
  async urlExists(url: string) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: url,
      };
      await httpClient.sendRequest(request);
      return true;
    } catch (e) {
      return false;
    }
  },
  async isBaseUrl(urlString: string): Promise<boolean> {
    try {
      const url = new URL(urlString);
      return !url.pathname || url.pathname === '/';
    } catch (error) {
      // Handle invalid URLs here, e.g., return false or throw an error
      return false;
    }
  },
};
