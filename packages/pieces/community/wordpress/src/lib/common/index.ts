import {
  DropdownOption,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
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
  tags: Property.MultiSelectDropdown<string, false>({
    description: 'Post tags',
    displayName: 'Tags',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      const connection = auth as PiecePropValueSchema<typeof wordpressAuth>;
      if (!connection) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!(await wordpressCommon.urlExists(connection.website_url.trim()))) {
        return {
          disabled: true,
          placeholder: 'Incorrect website url',
          options: [],
        };
      }

      let pageCursor = 1;
      const getTagsParams = {
        websiteUrl: connection.website_url.trim(),
        username: connection.username,
        password: connection.password,
        page: pageCursor,
      };
      const result: { id: string; name: string }[] = [];
      let hasNext = true;
      let tags = await wordpressCommon.getTags(getTagsParams);
      while (hasNext) {
        result.push(...tags.tags);
        hasNext = pageCursor <= tags.totalPages;
        if (hasNext) {
          pageCursor++;
          tags = await wordpressCommon.getTags({
            ...getTagsParams,
            page: pageCursor,
          });
        }
      }
      if (result.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please add tags from your admin dashboard',
        };
      }
      const options = result.map((res) => {
        return {
          label: res.name,
          value: res.id,
        };
      });
      return {
        options: options,
        disabled: false,
      };
    },
  }),
  categories: Property.MultiSelectDropdown<string, false>({
    description: 'Post categories',
    displayName: 'Categories',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      const connection = auth as PiecePropValueSchema<typeof wordpressAuth>;
      if (!connection) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!(await wordpressCommon.urlExists(connection.website_url.trim()))) {
        return {
          disabled: true,
          placeholder: 'Incorrect website url',
          options: [],
        };
      }

      let pageCursor = 1;
      const getTagsParams = {
        websiteUrl: connection.website_url,
        username: connection.username,
        password: connection.password,
        perPage: 10,
        page: pageCursor,
      };
      const result: { id: string; name: string }[] = [];
      let categories = await wordpressCommon.getCategories(getTagsParams);
      let hasNext = true;
      while (hasNext) {
        result.push(...categories.categories);
        hasNext = pageCursor <= categories.totalPages;
        if (hasNext) {
          pageCursor++;
          categories = await wordpressCommon.getCategories({
            ...getTagsParams,
            page: pageCursor,
          });
        }
      }
      if (result.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please add categories from your admin dashboard',
        };
      }
      const options = result.map((res) => {
        return {
          label: res.name,
          value: res.id,
        };
      });
      return {
        options: options,
        disabled: false,
      };
    },
  }),
  featured_media: Property.Dropdown({
    description: 'Choose from one of your uploaded media files',
    displayName: 'Featured Media (image)',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      const connection = auth as PiecePropValueSchema<typeof wordpressAuth>;
      if (!connection) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!(await wordpressCommon.urlExists(connection.website_url.trim()))) {
        return {
          disabled: true,
          placeholder: 'Incorrect website url',
          options: [],
        };
      }

      let pageCursor = 1;
      const getMediaParams = {
        websiteUrl: connection.website_url,
        username: connection.username,
        password: connection.password,
        page: pageCursor,
      };
      const result: WordPressMedia[] = [];
      let media = await wordpressCommon.getMedia(getMediaParams);
      if (media.totalPages === 0) {
        result.push(...media.media);
      }
      while (media.media.length > 0 && pageCursor <= media.totalPages) {
        result.push(...media.media);
        pageCursor++;
        media = await wordpressCommon.getMedia(getMediaParams);
      }
      if (result.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Please add an image to your media from your admin dashboard',
        };
      }
      const options = result.map((res) => {
        return {
          label: res.title.rendered,
          value: res.id,
        };
      });
      return {
        options: options,
        disabled: false,
      };
    },
  }),
  status: Property.StaticDropdown({
    description: 'Choose post status',
    displayName: 'Status',
    required: false,
    options: {
      disabled: false,
      options: [
        { value: 'publish', label: 'Published' },
        { value: 'future', label: 'Scheduled' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'private', label: 'Private' },
        { value: 'trash', label: 'Trash' },
      ],
    },
  }),
  post: Property.Dropdown({
    displayName: 'Post',
    required: true,
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
      const postOptions: DropdownOption<number>[] = [];
      let currentPage = 0;
      let totalPage = 0;

      do {
        currentPage += 1;
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${websiteUrl.trim()}/wp-json/wp/v2/posts`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: connection.username,
            password: connection.password,
          },
          queryParams: {
            orderby: 'date',
            order: 'desc',
            per_page: '50',
            page: currentPage.toString(),
          },
        };

        const response = await httpClient.sendRequest(request);
        totalPage = parseInt(
          response.headers?.['x-wp-totalpages'] as string,
          10
        );

        postOptions.push(
          ...response.body.map(
            (post: { id: number; title: { rendered: string } }) => {
              return {
                label: post.title.rendered
                  ? post.title.rendered
                  : post.id.toString(),
                value: post.id,
              };
            }
          )
        );
      } while (totalPage !== currentPage);

      return {
        disabled: false,
        options: postOptions,
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
