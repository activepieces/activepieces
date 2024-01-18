import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../..';
import { common } from '../common';

export const createPost = createAction({
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create a new post',
  auth: ghostAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Scheduled', value: 'scheduled' },
        ],
      },
    }),
    publishedAt: Property.DateTime({
      displayName: 'Published At',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'Content (HTML)',
      required: true,
    }),
    customExcerpt: Property.ShortText({
      displayName: 'Custom Excerpt',
      required: false,
    }),
    author: common.properties.author,
    featured: Property.Checkbox({
      displayName: 'Featured',
      required: false,
    }),
    tags: common.properties.tags,
  },

  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${context.auth.baseUrl}/ghost/api/admin/posts`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.apiKey)}`,
      },
      body: {
        posts: [
          {
            title: context.propsValue.title,
            slug: context.propsValue.slug,
            status: context.propsValue.status,
            html: context.propsValue.html,
            published_at: context.propsValue.publishedAt,
            authors: [context.propsValue.author],
            featured: context.propsValue.featured,
            custom_excerpt: context.propsValue.customExcerpt,
            tags: context.propsValue.tags,
          },
        ],
      },
      queryParams: {
        source: 'html',
      },
    });

    return response.body;
  },
});
