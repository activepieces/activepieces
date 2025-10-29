import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBlogPost = createAction({
  auth: bigCommerceAuth,
  name: 'create_blog_post',
  displayName: 'Create Blog Post',
  description: 'Create a new blog post in BigCommerce',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the blog post',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The content of the blog post (HTML supported)',
      required: true,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'The author of the blog post',
      required: false,
    }),
    is_published: Property.Checkbox({
      displayName: 'Is Published',
      description: 'Whether the blog post is published',
      required: false,
      defaultValue: true,
    }),
    published_date: Property.DateTime({
      displayName: 'Published Date',
      description: 'The date the blog post was/will be published',
      required: false,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'A short summary or excerpt of the blog post',
      required: false,
    }),
    meta_description: Property.ShortText({
      displayName: 'Meta Description',
      description: 'Meta description for SEO',
      required: false,
    }),
    meta_keywords: Property.ShortText({
      displayName: 'Meta Keywords',
      description: 'Meta keywords for SEO (comma-separated)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL path for the blog post (e.g., /my-blog-post)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags for the blog post',
      required: false,
    }),
  },
  async run(context) {
    const {
      title,
      body,
      author,
      is_published,
      published_date,
      summary,
      meta_description,
      meta_keywords,
      url,
      tags,
    } = context.propsValue;

    // Build blog post object
    const blogPostData: Record<string, any> = {
      title,
      body,
    };

    // Add optional fields
    if (author) blogPostData['author'] = author;
    if (is_published !== undefined) blogPostData['is_published'] = is_published;
    if (published_date) {
      // Format date to RFC 2822 format or ISO string
      const date = new Date(published_date);
      blogPostData['published_date'] = {
        date: date.toISOString(),
      };
    }
    if (summary) blogPostData['summary'] = summary;
    if (meta_description) blogPostData['meta_description'] = meta_description;
    if (meta_keywords) blogPostData['meta_keywords'] = meta_keywords;
    if (url) blogPostData['url'] = url;
    if (tags && Array.isArray(tags) && tags.length > 0) {
      blogPostData['tags'] = tags;
    }

    // Send request to create blog post (V2 API)
    const response = await sendBigCommerceRequest<{
      id: number;
      title: string;
      body: string;
      author: string;
      is_published: boolean;
      published_date: {
        date: string;
        timezone_type: number;
        timezone: string;
      };
      summary: string;
      meta_description: string;
      meta_keywords: string;
      url: string;
      tags: string[];
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.POST,
      url: '/blog/posts',
      body: blogPostData,
      version: 'v2',
    });

    return response.body;
  },
});
