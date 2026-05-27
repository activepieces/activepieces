import { createAction, Property } from '@activepieces/pieces-framework';
import { ackpostAuth } from '../common/auth';
import { createClient, callMcp, MCP_BASE_URL } from '../common/client';

export const createBlog = createAction({
  auth: ackpostAuth,
  name: 'create_blog',
  displayName: 'Create Blog Post',
  description: 'Creates an article/blog post in AckPost Article Studio.',
  props: {
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The brand to create the article under.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Article title.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Article content (HTML or markdown).',
      required: true,
    }),
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: 'Short description or summary.',
      required: false,
    }),
    coverImageUrl: Property.ShortText({
      displayName: 'Cover Image URL',
      description: 'URL of the cover image.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createClient(MCP_BASE_URL, auth.apiKey);
    return callMcp(client, 'blog/create', {
      workspace_id: auth.workspaceId,
      brand_id: propsValue.brandId,
      title: propsValue.title,
      body: propsValue.body,
      excerpt: propsValue.excerpt || '',
      cover_image_url: propsValue.coverImageUrl || '',
    });
  },
});
