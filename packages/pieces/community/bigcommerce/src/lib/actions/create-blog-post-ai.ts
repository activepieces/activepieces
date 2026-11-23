import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { blogPostOutputSchema } from '../common/schemas';
import { parseCommaList, parseIsoDate, parseYesNo, runCreateBlogPost } from '../common/shared-runs';

export const createBlogPostAi = createAction({
  auth: bigcommerceAuth,
  name: 'createBlogPostAi',
  classification: 'WRITE',
  displayName: 'Create Blog Post (AI)',
  description: 'Creates a blog post. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a blog post in a BigCommerce store's blog and returns the created post. Requires title, body (HTML allowed) and is_published ('yes' publishes now, 'no' saves a draft). Optional: author, url (path such as /blog/my-post/), published_date as ISO 8601, meta_description, meta_keywords, and tags as a comma-separated list. Not idempotent: each call creates a new post.",
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
    is_published: Property.StaticDropdown({
      displayName: 'Is Published',
      description: "'yes' publishes the post, 'no' saves it as a draft",
      required: true,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author name',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Path of the public blog post, for example /blog/welcome-bigcommerce/',
      required: false,
    }),
    published_date: Property.ShortText({
      displayName: 'Published Date',
      description: 'ISO 8601 date or date-time, for example 2026-01-31T15:00:00Z',
      required: false,
    }),
    meta_description: Property.LongText({
      displayName: 'Meta Description',
      description: 'Description text for the post <meta/> element',
      required: false,
    }),
    meta_keywords: Property.ShortText({
      displayName: 'Meta Keywords',
      description: 'Comma-separated keywords for the post <meta/> element',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tags, for example news, sale',
      required: false,
    }),
  },
  async run(context) {
    const isPublished = parseYesNo({ value: context.propsValue.is_published, field: 'is_published' });
    const publishedDate = parseIsoDate({ value: context.propsValue.published_date, field: 'published_date' });
    const tags = parseCommaList(context.propsValue.tags);
    return await runCreateBlogPost({
      auth: context.auth.props,
      input: {
        title: context.propsValue.title,
        body: context.propsValue.body,
        author: context.propsValue.author,
        url: context.propsValue.url,
        published_date: publishedDate,
        meta_description: context.propsValue.meta_description,
        meta_keywords: context.propsValue.meta_keywords,
        tags: tags.length > 0 ? tags : undefined,
        is_published: isPublished,
      },
    });
  },
});
