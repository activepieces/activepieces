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
import { createPostActionOutputSchema } from '../output-schemas';

export const createWordPressPost = createAction({
  auth: wordpressAuth,
  name: 'create_post',
  classification: 'WRITE',
  description: 'Add a new post to your WordPress site',
  audience: 'both',
  aiMetadata: { description: 'Publishes a new blog post on a WordPress site via the REST API, with optional status (draft/publish/etc.), categories, tags, excerpt, featured image, and custom ACF fields. Choose this to add fresh content; for editing an existing post use Update Post. Requires a title and HTML content; not idempotent — each call creates a separate post.', idempotent: false },
  displayName: 'Create Post',
  outputSchema: createPostActionOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    content: Property.LongText({
      description: 'Body of the post. HTML is allowed.',
      displayName: 'Content',
      required: true,
    }),
    status: wordpressCommon.status,
    date: Property.ShortText({
      description: "Publish date and time in the site's timezone.",
      displayName: 'Publish Date',
      placeholder: '2026-09-21T09:00:00',
      required: false,
    }),
    categories: wordpressCommon.categories,
    tags: wordpressCommon.tags,
    featured_media: wordpressCommon.featured_media,
    featured_media_file: wordpressCommon.featured_media_file,
    excerpt: Property.LongText({
      description: 'Short summary shown in listings. HTML is allowed.',
      displayName: 'Excerpt',
      required: false,
    }),
    slug: Property.ShortText({
      advanced: true,
      description: 'Last part of the URL.',
      displayName: 'Slug',
      placeholder: 'my-first-post',
      required: false,
    }),
    acfFields: Property.Object({
      advanced: true,
      displayName: 'ACF Fields',
      description:
        'Field names and values for the Advanced Custom Fields plugin.',
      required: false,
    }),
    comment_status: Property.Checkbox({
      advanced: true,
      description: 'On lets readers comment. Off leaves the setting as is.',
      displayName: 'Allow Comments',
      required: false,
    }),
    ping_status: Property.Checkbox({
      advanced: true,
      description: 'On accepts pingbacks and trackbacks. Off leaves it as is.',
      displayName: 'Allow Pingbacks',
      required: false,
    }),
  },
  async run(context) {
    if (!(await wordpressCommon.urlExists(context.auth.props.website_url.trim()))) {
      throw new Error('Website url is invalid: ' + context.auth.props.website_url);
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
        url: `${context.auth.props.website_url.trim()}/wp-json/wp/v2/media`,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: context.auth.props.username,
          password: context.auth.props.password,
        },
      });
      requestBody['featured_media'] = uploadMediaResponse.body.id;
    }
    requestBody['content'] = context.propsValue.content;
    requestBody['title'] = context.propsValue.title;
    return await httpClient.sendRequest<{ id: string; name: string }[]>({
      method: HttpMethod.POST,
      url: `${context.auth.props.website_url.trim()}/wp-json/wp/v2/posts`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.props.username,
        password: context.auth.props.password,
      },
      body: requestBody,
    });
  },
});
