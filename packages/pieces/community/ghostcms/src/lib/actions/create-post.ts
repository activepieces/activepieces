import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../auth';
import { common } from '../common';
import { ghostOriginalCreatePostOutputSchema } from '../output-schemas';

export const createPost = createAction({
  name: 'create_post',
  outputSchema: ghostOriginalCreatePostOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Create a new post',
  audience: 'human',
  aiMetadata: { description: 'Creates a new post in a Ghost publication from a title and HTML content, with the status controlling whether it is saved as a draft, published immediately, or scheduled (scheduled requires a future Published At). Supports optional slug, excerpt, author, tags, and a featured flag. Not idempotent: each call creates a separate post.', idempotent: false },
  auth: ghostAuth,
  propertyGroups: [
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['title', 'slug', 'html', 'customExcerpt'],
    },
    {
      key: 'publishing',
      display: 'section',
      label: 'Publishing',
      icon: 'send',
      props: ['status', 'publishedAt', 'author', 'featured', 'tags'],
    },
  ],
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      width: 'half',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Generated from the title when empty.',
      width: 'half',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'Body',
      description: 'HTML is supported.',
      placeholder: '<p>Hello world</p>',
      required: true,
    }),
    customExcerpt: Property.ShortText({
      displayName: 'Custom Excerpt',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Draft',
            value: 'draft',
            description: 'Not live',
            icon: 'file',
          },
          {
            label: 'Published',
            value: 'published',
            description: 'Live now',
            icon: 'send',
          },
          {
            label: 'Scheduled',
            value: 'scheduled',
            description: 'Later',
            icon: 'calendar',
          },
        ],
      },
    }),
    publishedAt: Property.DateTime({
      displayName: 'Published At',
      description: 'Required when Status is Scheduled. Use a future date.',
      required: false,
    }),
    author: common.properties.author,
    featured: Property.Checkbox({
      displayName: 'Featured',
      description: 'Highlight the post on your site.',
      width: 'half',
      required: false,
    }),
    tags: common.properties.tags,
  },

  async run(context) {
    if (
      context.propsValue.status === 'scheduled' &&
      !context.propsValue.publishedAt
    ) {
      throw new Error('Published At is required when Status is Scheduled.');
    }

    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/posts`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
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
