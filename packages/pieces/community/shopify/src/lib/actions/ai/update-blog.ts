import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBlog,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateBlog = createAction({
  auth: shopifyAuth,
  name: 'update_blog',
  classification: 'WRITE',
  displayName: 'Update Blog',
  description: 'Change a blog\'s title, handle, comment policy or template.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one blog and returns it. Only the fields you supply are sent; at least one is required. Changing the handle changes the blog URL; redirect_new_handle and redirect_articles decide whether redirects are created from the old blog and article URLs (leave empty for the Shopify default). Articles are not touched. Repeating the same update leaves the same state. Needs the write_content access scope.',
    idempotent: true,
  },
  props: {
    blog_id: Property.ShortText({
      displayName: 'Blog ID',
      description: 'The blog id, numeric or "gid://shopify/Blog/…". Find it with list_blogs.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New blog title.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'New URL handle, for example "company-news".',
      required: false,
    }),
    redirect_new_handle: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Blog URL',
      description: 'When changing the handle, create a redirect from the old blog URL. Leave empty for the Shopify default.',
    }),
    redirect_articles: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Article URLs',
      description: 'When changing the handle, also redirect the old URLs of the blog\'s articles. Leave empty for the Shopify default.',
    }),
    comment_policy: Property.StaticDropdown({
      displayName: 'Comment Policy',
      description: 'New comment policy. Leave empty to keep the current one.',
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
      description: 'New theme template suffix, for example "wide". Leave empty to keep the current one.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const changes = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      commentPolicy: propsValue.comment_policy,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const blog = shopifyValues.compact({
      ...changes,
      redirectNewHandle: shopifyValues.toBooleanChoice(propsValue.redirect_new_handle),
      redirectArticles: shopifyValues.toBooleanChoice(propsValue.redirect_articles),
    });
    const id = shopifyGraphqlClient.toGid({ type: 'Blog', id: propsValue.blog_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      blogUpdate: { blog: GqlBlog | null } | null;
    }>({
      auth,
      query: `mutation UpdateBlog($id: ID!, $blog: BlogUpdateInput!) { blogUpdate(id: $id, blog: $blog) { blog { ${shopifyFields.BLOG_FIELDS} } userErrors { field message code } } }`,
      variables: { id, blog },
    });
    const updated = data.blogUpdate?.blog;
    if (!updated) {
      throw new Error('Shopify did not return the updated blog.');
    }
    return {
      ...shopifyMappers.mapBlog(updated),
      redacted_fields: redactedFields,
    };
  },
});
