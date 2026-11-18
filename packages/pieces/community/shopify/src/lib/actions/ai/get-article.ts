import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlArticle,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { articleOutputSchema } from '../../output-schemas/content';

export const shopifyAiGetArticle = createAction({
  auth: shopifyAuth,
  name: 'get_article',
  classification: 'READ',
  displayName: 'Get Blog Article',
  description: 'Get one blog article with its body and comment count.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one blog article: title, handle, author, blog, full body HTML, summary, tags, publish state and date, image, template suffix and comments_count. list_comments returns the store\'s comments, each with its article_id. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: articleOutputSchema,
  props: {
    article_id: Property.ShortText({
      displayName: 'Article ID',
      description: 'The article id, numeric or "gid://shopify/Article/…". Find it with list_articles.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Article', id: propsValue.article_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      article: GqlArticle | null;
    }>({
      auth,
      query: `query GetArticle($id: ID!) { article(id: $id) { ${shopifyFields.ARTICLE_FIELDS} } }`,
      variables: { id },
    });
    if (!data.article) {
      throw new Error(`Article ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapArticle(data.article),
      redacted_fields: redactedFields,
    };
  },
});
