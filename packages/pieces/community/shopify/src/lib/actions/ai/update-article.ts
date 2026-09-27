import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlArticle,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { articleOutputSchema } from '../../output-schemas/content';

export const shopifyAiUpdateArticle = createAction({
  auth: shopifyAuth,
  name: 'update_article',
  classification: 'WRITE',
  displayName: 'Update Blog Article',
  description: 'Change an article\'s title, body, author, tags, image, publish state or blog.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one blog article and returns it. Only the fields you supply are sent; at least one is required. Sending tags replaces all of the article\'s tags, so send the complete list, or use add_tags / remove_tags for single tags. is_published Yes makes the article visible on the storefront and No hides it. blog_id moves the article to another blog. Repeating the same update leaves the same state. Needs the write_content access scope. To empty the body or remove every tag, set clear_body or clear_tags instead of sending an empty value.',
    idempotent: true,
  },
  outputSchema: articleOutputSchema,
  props: {
    article_id: Property.ShortText({
      displayName: 'Article ID',
      description: 'The article id, numeric or "gid://shopify/Article/…". Find it with list_articles.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'New article content, HTML allowed. Replaces the whole body.',
      required: false,
    }),
    summary_html: Property.LongText({
      displayName: 'Summary (HTML)',
      description: 'New excerpt, HTML allowed.',
      required: false,
    }),
    author_name: Property.ShortText({
      displayName: 'Author Name',
      description: 'New author name.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete new tag list. Replaces every existing tag; leave empty to keep the current tags (use clear_tags to remove all).',
      required: false,
    }),
    is_published: shopifyProps.booleanChoice({
      displayName: 'Published',
      description: 'Yes publishes the article, No hides it. Leave empty to keep the current state.',
    }),
    publish_date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'New publication date and time, ISO 8601.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'New URL handle, for example "summer-collection-2026".',
      required: false,
    }),
    redirect_new_handle: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Handle',
      description: 'When changing the handle, create a redirect from the old URL. Leave empty for the Shopify default.',
    }),
    blog_id: Property.ShortText({
      displayName: 'Move to Blog ID',
      description: 'Move the article to this blog, numeric or "gid://shopify/Blog/…".',
      required: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of a new featured image.',
      required: false,
    }),
    image_alt_text: Property.ShortText({
      displayName: 'Image Alt Text',
      description: 'Alternative text for the featured image. Needs image_url.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'New theme template suffix.',
      required: false,
    }),
    clear_body: Property.Checkbox({
      displayName: 'Clear Body',
      description: 'Remove the existing content. Leave body_html empty when using this.',
      required: false,
      defaultValue: false,
    }),
    clear_tags: Property.Checkbox({
      displayName: 'Clear Tags',
      description: 'Remove every tag. Leave tags empty when using this.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const imageUrl = shopifyValues.nonEmpty(propsValue.image_url);
    const imageAltText = shopifyValues.nonEmpty(propsValue.image_alt_text);
    if (imageAltText && !imageUrl) {
      throw new Error('image_alt_text needs image_url. Nothing was changed.');
    }
    const authorName = shopifyValues.nonEmpty(propsValue.author_name);
    const blogId = shopifyValues.nonEmpty(propsValue.blog_id);
    const tags = shopifyValues.readStringList(propsValue.tags);
    const changes = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      body: shopifyValues.readClearable({ value: shopifyValues.nonEmpty(propsValue.body_html), clear: propsValue.clear_body, name: 'body_html', empty: '' }),
      summary: shopifyValues.nonEmpty(propsValue.summary_html),
      author: authorName ? { name: authorName } : undefined,
      tags: shopifyValues.readClearable({ value: tags && tags.length > 0 ? tags : undefined, clear: propsValue.clear_tags, name: 'tags', empty: [] }),
      isPublished: shopifyValues.toBooleanChoice(propsValue.is_published),
      publishDate: shopifyValues.nonEmpty(propsValue.publish_date),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      blogId: blogId ? shopifyGraphqlClient.toGid({ type: 'Blog', id: blogId }) : undefined,
      image: imageUrl ? shopifyValues.compact({ url: imageUrl, altText: imageAltText }) : undefined,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const article = shopifyValues.compact({
      ...changes,
      redirectNewHandle: shopifyValues.toBooleanChoice(propsValue.redirect_new_handle),
    });
    const id = shopifyGraphqlClient.toGid({ type: 'Article', id: propsValue.article_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articleUpdate: { article: GqlArticle | null } | null;
    }>({
      auth,
      query: `mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { ${shopifyFields.ARTICLE_FIELDS} } userErrors { field message code } } }`,
      variables: { id, article },
    });
    const updated = data.articleUpdate?.article;
    if (!updated) {
      throw new Error('Shopify did not return the updated article.');
    }
    return {
      ...shopifyMappers.mapArticle(updated),
      redacted_fields: redactedFields,
    };
  },
});
