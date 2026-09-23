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

export const shopifyAiCreateArticle = createAction({
  auth: shopifyAuth,
  name: 'create_article',
  classification: 'WRITE',
  displayName: 'Create Blog Article',
  description: 'Write a new article in an existing blog.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an article in an existing blog and returns it with its id. Needs the blog id (from list_blogs), a title and an author name; the body is HTML. The article is created hidden unless is_published is Yes, so nothing goes live by accident. publish_date alone does not publish or schedule the article; is_published must be Yes as well. Each call creates another article, so do not repeat it after a success. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    blog_id: Property.ShortText({
      displayName: 'Blog ID',
      description: 'The blog to write in, numeric or "gid://shopify/Blog/…". Find it with list_blogs.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Article title, for example "Our summer collection is here".',
      required: true,
    }),
    author_name: Property.ShortText({
      displayName: 'Author Name',
      description: 'Name shown as the author, for example "Jane Doe".',
      required: true,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'Article content, HTML allowed, for example "<p>Hello</p>".',
      required: false,
    }),
    summary_html: Property.LongText({
      displayName: 'Summary (HTML)',
      description: 'Short excerpt shown in blog listings, HTML allowed.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags for the article, for example ["news", "summer"].',
      required: false,
    }),
    is_published: shopifyProps.booleanChoice({
      displayName: 'Published',
      description: 'Yes publishes the article on the storefront. Leave empty or No to keep it hidden.',
    }),
    publish_date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'Publication date and time, ISO 8601, for example "2026-10-01T09:00:00Z". It does not publish or schedule the article on its own; Published must be Yes as well.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "summer-collection". Leave empty to generate it from the title.',
      required: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the featured image, for example "https://example.com/banner.jpg".',
      required: false,
    }),
    image_alt_text: Property.ShortText({
      displayName: 'Image Alt Text',
      description: 'Alternative text for the featured image. Needs image_url.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix, for example "wide". Leave empty for the default template.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    const authorName = shopifyValues.nonEmpty(propsValue.author_name);
    if (!title || !authorName) {
      throw new Error('An article needs a title and an author_name. Nothing was created.');
    }
    const imageUrl = shopifyValues.nonEmpty(propsValue.image_url);
    const imageAltText = shopifyValues.nonEmpty(propsValue.image_alt_text);
    if (imageAltText && !imageUrl) {
      throw new Error('image_alt_text needs image_url. Nothing was created.');
    }
    const tags = shopifyValues.readStringList(propsValue.tags);
    const article = shopifyValues.compact({
      blogId: shopifyGraphqlClient.toGid({ type: 'Blog', id: propsValue.blog_id }),
      title,
      author: { name: authorName },
      body: shopifyValues.nonEmpty(propsValue.body_html),
      summary: shopifyValues.nonEmpty(propsValue.summary_html),
      tags: tags && tags.length > 0 ? tags : undefined,
      isPublished: shopifyValues.toBooleanChoice(propsValue.is_published) ?? false,
      publishDate: shopifyValues.nonEmpty(propsValue.publish_date),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      image: imageUrl ? shopifyValues.compact({ url: imageUrl, altText: imageAltText }) : undefined,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      articleCreate: { article: GqlArticle | null } | null;
    }>({
      auth,
      query: `mutation CreateArticle($article: ArticleCreateInput!) { articleCreate(article: $article) { article { ${shopifyFields.ARTICLE_FIELDS} } userErrors { field message code } } }`,
      variables: { article },
    });
    const created = data.articleCreate?.article;
    if (!created) {
      throw new Error('Shopify did not return the created article.');
    }
    return {
      ...shopifyMappers.mapArticle(created),
      redacted_fields: redactedFields,
    };
  },
});
