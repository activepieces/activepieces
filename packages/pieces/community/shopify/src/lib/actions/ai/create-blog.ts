import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBlog,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateBlog = createAction({
  auth: shopifyAuth,
  name: 'create_blog',
  classification: 'WRITE',
  displayName: 'Create Blog',
  description: 'Create a new blog on the online store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a blog on the online store and returns it with its id. Only the title is required; the handle is generated from the title when left empty. comment_policy decides whether readers can comment (CLOSED, MODERATED or AUTO_PUBLISHED); when empty Shopify\'s default applies. Each call creates another blog, so do not repeat it after a success. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Blog title, for example "News".',
      required: true,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "news". Leave empty to generate it from the title.',
      required: false,
    }),
    comment_policy: Property.StaticDropdown({
      displayName: 'Comment Policy',
      description: 'Whether readers can comment on articles. Leave empty for the Shopify default.',
      required: false,
      options: {
        options: [
          { label: 'Comments closed', value: 'CLOSED' },
          { label: 'Comments held for moderation', value: 'MODERATED' },
          { label: 'Comments published automatically', value: 'AUTO_PUBLISHED' },
        ],
      },
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix, for example "wide" for blog.wide.json. Leave empty for the default template.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    if (!title) {
      throw new Error('A blog title is required. Nothing was created.');
    }
    const blog = shopifyValues.compact({
      title,
      handle: shopifyValues.nonEmpty(propsValue.handle),
      commentPolicy: propsValue.comment_policy,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      blogCreate: { blog: GqlBlog | null } | null;
    }>({
      auth,
      query: `mutation CreateBlog($blog: BlogCreateInput!) { blogCreate(blog: $blog) { blog { ${shopifyFields.BLOG_FIELDS} } userErrors { field message code } } }`,
      variables: { blog },
    });
    const created = data.blogCreate?.blog;
    if (!created) {
      throw new Error('Shopify did not return the created blog.');
    }
    return {
      ...shopifyMappers.mapBlog(created),
      redacted_fields: redactedFields,
    };
  },
});
