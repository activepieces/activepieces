import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressCommon } from '../common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wordpressAuth } from '../..';
import { updatePostActionOutputSchema } from '../output-schemas';

export const updateWordPressPost = createAction({
  auth: wordpressAuth,
  name: 'update_post',
  classification: 'WRITE',
  description: 'Change the title, content or settings of an existing post',
  audience: 'human',
  aiMetadata: { description: 'Updates an existing WordPress post identified by its post ID, changing only the fields you supply (title, content, status, categories, tags, excerpt, featured image, or ACF fields). Choose this to edit or republish a known post rather than create a new one. Requires the target post ID; idempotent — repeating with the same input leaves the post in the same final state.', idempotent: true },
  displayName: 'Update Post',
  outputSchema: updatePostActionOutputSchema,
  props: {
    post: wordpressCommon.post,
    title: Property.ShortText({
      description: 'New title. Empty keeps the current one.',
      displayName: 'Title',
      required: false,
    }),
    content: Property.LongText({
      description: 'New body, HTML allowed. Empty keeps the current one.',
      displayName: 'Content',
      required: false,
    }),
    status: wordpressCommon.status,
    categories: wordpressCommon.categories,
    tags: wordpressCommon.tags,
    featured_media: wordpressCommon.featured_media,
    featured_media_file: wordpressCommon.featured_media_file,
    excerpt: Property.LongText({
      description: 'Short summary shown in listings. HTML is allowed.',
      displayName: 'Excerpt',
      required: false,
    }),
    date: Property.ShortText({
      advanced: true,
      description: "Publish date and time in the site's timezone.",
      displayName: 'Publish Date',
      placeholder: '2026-09-21T09:00:00',
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

    if (context.propsValue.title) {
      requestBody['title'] = context.propsValue.title;
    }

    if (context.propsValue.content) {
      requestBody['content'] = context.propsValue.content;
    }

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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.props.website_url.trim()}/wp-json/wp/v2/posts/${
        context.propsValue.post
      }`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.props.username,
        password: context.auth.props.password,
      },
      body: requestBody,
    });

    return response.body;
  },
});
