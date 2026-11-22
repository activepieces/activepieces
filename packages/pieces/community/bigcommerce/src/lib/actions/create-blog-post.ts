import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { blogPostOutputSchema } from '../common/schemas';
import { runCreateBlogPost } from '../common/shared-runs';

export const createBlogPost = createAction({
  auth: bigcommerceAuth,
  name: 'createBlogPost',
  classification: 'WRITE',
  displayName: 'Create Blog Post',
  description: 'Creates a blog post',
  audience: 'human',
  aiMetadata: {
    description:
      "Creates a blog post in a BigCommerce store's blog. Requires a title and body (HTML supported); author, URL, published date, meta description/keywords, tags, and a published flag are optional. Use to publish store blog content. Agents should use Create Blog Post (AI). Not idempotent: each call creates a new post.",
    idempotent: false,
  },
  outputSchema: blogPostOutputSchema,
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
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'URL for the public blog post. Example - /blog/welcome-bigcommerce/',
      required: false,
    }),
    published_date: Property.DateTime({
      displayName: 'Published Date',
      description:
        'Published Date for the blog post. Example - Wed, 10 Aug 2022 15:39:15 -0500',
      required: false,
    }),
    meta_description: Property.LongText({
      displayName: 'Meta Description',
      description: 'Description text for this blog post’s <meta/> element.',
      required: false,
    }),
    meta_keywords: Property.LongText({
      displayName: 'Meta Keywords',
      description: 'Comma seperated (,) Keywords for this blog post’s <meta/> element. Eg welcome, bigcommerce',
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
    const { tags } = context.propsValue;
    return await runCreateBlogPost({
      auth: context.auth.props,
      input: {
        title: context.propsValue.title,
        body: context.propsValue.body,
        author: context.propsValue.author,
        url: context.propsValue.url,
        published_date: context.propsValue.published_date,
        meta_description: context.propsValue.meta_description,
        meta_keywords: context.propsValue.meta_keywords,
        tags: Array.isArray(tags)
          ? tags.map((tag) => String(tag).trim()).filter((tag) => tag !== '')
          : undefined,
        is_published: context.propsValue.is_published,
      },
    });
  },
});
