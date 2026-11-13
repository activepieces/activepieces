import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlCount, shopifyGraphqlClient } from '../../common/graphql';
import { countOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCountCustomerSegments = createAction({
  auth: shopifyAuth,
  name: 'count_customer_segments',
  classification: 'READ',
  displayName: 'Count Customer Segments',
  description: 'Count the customer segments defined in the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many customer segments (saved customer groups) the store has. precision is AT_LEAST when Shopify stopped counting at its limit. Read-only.',
    idempotent: true,
  },
  outputSchema: countOutputSchema,
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      segmentsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountCustomerSegments { segmentsCount { count precision } }`,
    });
    return {
      count: data.segmentsCount?.count ?? 0,
      precision: data.segmentsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
