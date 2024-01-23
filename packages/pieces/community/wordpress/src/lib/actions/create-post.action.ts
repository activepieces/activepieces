import {
  createAction,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { wordpressCommon, WordpressMedia } from '../common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wordpressAuth } from '../..';

export const createWordpressPost = createAction({
  auth: wordpressAuth,
  name: 'create_post',
  description: 'Create new post on Wordpress',
  displayName: 'Create Post',
  props: {
    title: Property.ShortText({
      description: 'Title of the post about to be added',
      displayName: 'Title',
      required: true,
    }),
    content: Property.LongText({
      description: 'Uses the WordPress Text Editor which supports HTML',
      displayName: 'Content',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      required: false,
    }),
    date: Property.ShortText({
      description: 'Post publish date (ISO-8601)',
      displayName: 'Date',
      required: false,
    }),
    featured_media_file: wordpressCommon.featured_media_file,
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
        const result: WordpressMedia[] = [];
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
    excerpt: Property.LongText({
      description: 'Uses the WordPress Text Editor which supports HTML',
      displayName: 'Excerpt',
      required: false,
    }),
    comment_status: Property.Checkbox({
      displayName: 'Enable Comments',
      required: false,
    }),
    ping_status: Property.Checkbox({
      displayName: 'Open to Pinging',
      required: false,
    }),
  },
  async run(context) {
    if (!(await wordpressCommon.urlExists(context.auth.website_url.trim()))) {
      throw new Error('Website url is invalid: ' + context.auth.website_url);
    }
    const requestBody: Record<string, unknown> = {};
    if (context.propsValue.date) {
      requestBody['date'] = context.propsValue.date;
    }
    if (context.propsValue.comment_status) {
      requestBody['comment_status'] = context.propsValue.comment_status
        ? 'open'
        : 'closed';
    }
    if (context.propsValue.categories) {
      requestBody['categories'] = context.propsValue.categories;
    }
    if (context.propsValue.slug) {
      requestBody['slug'] = context.propsValue.slug;
    }
    if (context.propsValue.excerpt) {
      requestBody['excerpt'] = context.propsValue.excerpt;
    }
    if (context.propsValue.tags) {
      requestBody['tags'] = context.propsValue.tags;
    }
    if (context.propsValue.ping_status) {
      requestBody['ping_status'] = context.propsValue.ping_status
        ? 'open'
        : 'closed';
    }
    if (context.propsValue.status) {
      requestBody['status'] = context.propsValue.status;
    }
    if (context.propsValue.featured_media) {
      requestBody['featured_media'] = context.propsValue.featured_media;
    }

    if (context.propsValue.featured_media_file) {
      const formData = new FormData();
      const { filename, base64 } = context.propsValue.featured_media_file;
      formData.append('file', Buffer.from(base64, 'base64'), filename);
      const uploadMediaResponse = await httpClient.sendRequest<{ id: string }>({
        method: HttpMethod.POST,
        url: `${context.auth.website_url.trim()}/wp-json/wp/v2/media`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: context.auth.username,
          password: context.auth.password,
        },
      });
      requestBody['featured_media'] = uploadMediaResponse.body.id;
    }
    requestBody['content'] = context.propsValue.content;
    requestBody['title'] = context.propsValue.title;
    return await httpClient.sendRequest<{ id: string; name: string }[]>({
      method: HttpMethod.POST,
      url: `${context.auth.website_url.trim()}/wp-json/wp/v2/posts`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
      body: requestBody,
    });
  },
});
