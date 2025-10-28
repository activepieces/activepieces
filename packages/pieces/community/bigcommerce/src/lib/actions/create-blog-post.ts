import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getBlogPostFields = (): DynamicPropsValue => {
  return {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Blog post title (required, max 255 characters)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Blog post content (required, HTML allowed)',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'Blog post summary/excerpt (optional, max 65535 characters)',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Blog post author name (max 255 characters)',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags for categorization',
      required: false,
    }),
    is_published: Property.Checkbox({
      displayName: 'Is Published',
      description: 'Whether the blog post is published and visible to customers',
      required: false,
      defaultValue: true,
    }),
    published_date: Property.DateTime({
      displayName: 'Published Date',
      description: 'Date and time when the blog post should be published (ISO 8601 format)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL Slug',
      description: 'Custom URL slug for the blog post (auto-generated from title if not provided)',
      required: false,
    }),
    meta_description: Property.ShortText({
      displayName: 'Meta Description',
      description: 'SEO meta description (max 255 characters)',
      required: false,
    }),
    meta_keywords: Property.ShortText({
      displayName: 'Meta Keywords',
      description: 'SEO meta keywords (comma-separated)',
      required: false,
    }),
    search_keywords: Property.ShortText({
      displayName: 'Search Keywords',
      description: 'Internal search keywords (comma-separated)',
      required: false,
    }),
    thumbnail_path: Property.ShortText({
      displayName: 'Thumbnail Path',
      description: 'Path to thumbnail image (relative to store URL)',
      required: false,
    }),
    previewtext: Property.LongText({
      displayName: 'Preview Text',
      description: 'Preview text shown in blog post listings',
      required: false,
    }),
  };
};

export const createBlogPost = createAction({
  auth: bigcommerceAuth,
  name: 'create_blog_post',
  displayName: 'Create Blog Post',
  description: 'Creates a new blog post in BigCommerce following the official Store Content API requirements',
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

    const { title, body, tags, published_date, url } = blogPostFields as any;

    // Validate required fields according to BigCommerce API
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and cannot be empty');
    }

    if (title.length > 255) {
      throw new Error('Title cannot exceed 255 characters');
    }

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      throw new Error('Body is required and cannot be empty');
    }

    // Validate URL slug if provided
    if (url && typeof url === 'string') {
      const urlRegex = /^[a-z0-9-]+$/;
      if (!urlRegex.test(url)) {
        throw new Error('URL slug can only contain lowercase letters, numbers, and hyphens');
      }
    }

    try {
      const blogPostData: any = {
        title: title.trim(),
        body: body.trim(),
      };
      
      // Add optional fields if provided
      const optionalFields = [
        'summary', 'author', 'is_published', 'meta_description', 'meta_keywords',
        'search_keywords', 'thumbnail_path', 'previewtext', 'url'
      ];

      optionalFields.forEach(field => {
        const value = (blogPostFields as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          blogPostData[field] = typeof value === 'string' ? value.trim() : value;
        }
      });

      // Handle tags as array
      if (tags && typeof tags === 'string') {
        const tagArray = tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length > 0) {
          blogPostData.tags = tagArray;
        }
      }

      // Handle published_date
      if (published_date) {
        if (published_date instanceof Date) {
          blogPostData.published_date = published_date.toISOString();
        } else if (typeof published_date === 'string') {
          // Validate ISO 8601 format
          const dateObj = new Date(published_date);
          if (isNaN(dateObj.getTime())) {
            throw new Error('Published date must be a valid ISO 8601 date format');
          }
          blogPostData.published_date = dateObj.toISOString();
        }
      }

      console.log('Creating blog post with data:', JSON.stringify(blogPostData, null, 2));

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