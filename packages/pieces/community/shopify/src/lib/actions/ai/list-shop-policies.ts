import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlShopPolicy,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listShopPoliciesOutputSchema } from '../../output-schemas/store';

export const shopifyAiListShopPolicies = createAction({
  auth: shopifyAuth,
  name: 'list_shop_policies',
  classification: 'SEARCH',
  displayName: 'List Store Policies',
  description: 'List the store\'s legal policies (refund, shipping, privacy, terms).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s legal policies (refund, shipping, privacy, terms of service, terms of sale, legal notice, subscription, contact information) with their type, title, public URL and full HTML body. Policies the merchant never filled in may be missing from the list. Returns the full list in one call (no paging). Needs the read_legal_policies access scope. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listShopPoliciesOutputSchema,
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shop: { shopPolicies: GqlShopPolicy[] | null };
    }>({
      auth,
      query: `query ListShopPolicies { shop { shopPolicies { ${shopifyFields.SHOP_POLICY_FIELDS} } } }`,
      primaryPaths: ['shop.shopPolicies'],
    });
    const items = (data.shop.shopPolicies ?? []).map(shopifyMappers.mapShopPolicy);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
