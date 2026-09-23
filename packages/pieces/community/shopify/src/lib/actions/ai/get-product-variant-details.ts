import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlVariant,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetProductVariantDetails = createAction({
  auth: shopifyAuth,
  name: 'get_product_variant_details',
  classification: 'READ',
  displayName: 'Get Product Variant',
  description: 'Get one product variant with its price, SKU, stock and options.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one product variant by id: title, SKU, barcode, price, compare-at price, stock quantity, out-of-stock policy, option values, its inventory item id (needed by the inventory actions) and its product. Use list_product_variants to find variant ids. Read-only.',
    idempotent: true,
  },
  props: {
    variant_id: Property.ShortText({
      displayName: 'Variant ID',
      description:
        'The variant id: numeric such as "808950810" or "gid://shopify/ProductVariant/808950810". Find it with list_product_variants.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'ProductVariant', id: propsValue.variant_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariant: GqlVariant | null;
    }>({
      auth,
      query: `query GetProductVariantDetails($id: ID!) { productVariant(id: $id) { ${shopifyFields.VARIANT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.productVariant) {
      throw new Error(`Product variant ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapVariant(data.productVariant),
      redacted_fields: redactedFields,
    };
  },
});
