import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBlogPostAction = createAction({
  auth: bigcommerceAuth,
  name: 'create_blog_post',
  displayName: 'Create Blog Post',
  description: 'Creates a new blog post in BigCommerce',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Blog post title',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Blog post content (HTML supported)',
      required: true,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author name',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags',
      required: false,
    }),
    is_published: Property.Checkbox({
      displayName: 'Is Published',
      description: 'Whether the post is published',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      '/v2/blog/posts',
      HttpMethod.POST,
      {
        title: context.propsValue.title,
        body: context.propsValue.body,
        author: context.propsValue.author,
        tags: context.propsValue.tags,
        is_published: context.propsValue.is_published,
      }
    );
    return response.body;
  },
});
