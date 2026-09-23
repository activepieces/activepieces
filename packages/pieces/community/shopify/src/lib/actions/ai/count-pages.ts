import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlCount, shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiCountPages = createAction({
  auth: shopifyAuth,
  name: 'count_pages',
  classification: 'READ',
  displayName: 'Count Online Store Pages',
  description: 'Count the online store\'s content pages.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts all online store content pages, published and hidden alike (Shopify offers no filter for this count). Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Use list_pages to see or filter them. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      pagesCount: GqlCount | null;
    }>({
      auth,
      query: `query CountPages { pagesCount { count precision } }`,
    });
    return {
      count: data.pagesCount?.count ?? 0,
      precision: data.pagesCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
