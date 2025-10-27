import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getBlogPostFields = (): DynamicPropsValue => {
  return {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Blog post title',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Blog post content (HTML allowed)',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'Blog post summary/excerpt',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Blog post author',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags',
      required: false,
    }),
    is_published: Property.Checkbox({
      displayName: 'Is Published',
      description: 'Whether the blog post is published',
      required: false,
      defaultValue: true,
    }),
    meta_description: Property.ShortText({
      displayName: 'Meta Description',
      description: 'SEO meta description',
      required: false,
    }),
    meta_keywords: Property.ShortText({
      displayName: 'Meta Keywords',
      description: 'SEO meta keywords',
      required: false,
    }),
    thumbnail_path: Property.ShortText({
      displayName: 'Thumbnail Path',
      description: 'Path to thumbnail image',
      required: false,
    }),
  };
};

export const createBlogPost = createAction({
  auth: bigcommerceAuth,
  name: 'create_blog_post',
  displayName: 'Create Blog Post',
  description: 'Creates a new blog post in BigCommerce',
  props: {
    blogPostFields: Property.DynamicProperties({
      displayName: 'Blog Post Fields',
      description: 'Blog post information',
      required: true,
      refreshers: [],
      props: async () => {
        return getBlogPostFields();
      },
    }),
  },
  async run(context) {
    const { blogPostFields } = context.propsValue;

    if (!blogPostFields || typeof blogPostFields !== 'object') {
      throw new Error('Blog post fields are required');
    }

    const { title, body } = blogPostFields as any;

    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    try {
      const blogPostData: any = {};
      
      Object.entries(blogPostFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'tags' && typeof value === 'string') {
            blogPostData[key] = value.split(',').map((tag: string) => tag.trim());
          } else {
            blogPostData[key] = value;
          }
        }
      });

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/content/blog/posts',
        method: HttpMethod.POST,
        body: blogPostData,
      });

      const blogPost = (response.body as { data: any }).data;

      return {
        success: true,
        message: `Blog post "${title}" created successfully`,
        data: blogPost,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to create blog post');
    }
  },
});