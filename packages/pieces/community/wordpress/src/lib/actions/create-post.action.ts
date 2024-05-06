import {
  createAction,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { wordpressCommon, WordPressMedia } from '../common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wordpressAuth } from '../..';

export const createWordPressPost = createAction({
  auth: wordpressAuth,
  name: 'create_post',
  description: 'Create new post on WordPress',
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
    tags: wordpressCommon.tags,
    acfFields: Property.Object({
      displayName: 'Custom ACF fields',
      description:
        'Provide field name with value.You can find out field name from ACF plugin menu.',
      required: false,
    }),
    categories: wordpressCommon.categories,
    featured_media: wordpressCommon.featured_media,
    status: wordpressCommon.status,
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

    if (
      context.propsValue.acfFields &&
      Object.keys(context.propsValue.acfFields).length > 0
    ) {
      requestBody['acf'] = context.propsValue.acfFields;
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
