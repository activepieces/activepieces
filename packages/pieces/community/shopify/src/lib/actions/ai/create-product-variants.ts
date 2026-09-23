import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlVariant,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateProductVariants = createAction({
  auth: shopifyAuth,
  name: 'create_product_variants',
  classification: 'WRITE',
  displayName: 'Create Product Variants',
  description: 'Add one or more variants to a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds variants to an existing product in one call. Each variant needs a value for every product option (for example "Color=Red, Size=Large"); new values are added to the options automatically. Optionally stock each new variant at one location. With strategy REMOVE_STANDALONE_VARIANT the placeholder "Default Title" variant is removed. All-or-nothing: if one variant is invalid none is created. Each call creates new variants, so retries create duplicates or fail on existing option combinations.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    variants: shopifyProps.variants({ mode: 'create' }),
    strategy: Property.StaticDropdown({
      displayName: 'Default Variant Handling',
      description: 'What happens to the placeholder variant of a product without options. Leave empty for the Shopify default.',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'DEFAULT' },
          { label: 'Remove the standalone placeholder variant', value: 'REMOVE_STANDALONE_VARIANT' },
          { label: 'Keep the standalone placeholder variant', value: 'PRESERVE_STANDALONE_VARIANT' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const variants = shopifyValues.buildVariantInputs({ value: propsValue.variants, mode: 'create' });
    if (variants.length === 0) {
      throw new Error('Provide at least one variant to create.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariantsBulkCreate: { productVariants: GqlVariant[] | null; product: { id: string } | null } | null;
    }>({
      auth,
      query: `mutation CreateProductVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) { productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) { product { id } productVariants { ${shopifyFields.VARIANT_FIELDS} } userErrors { field message code } } }`,
      variables: { productId, variants, strategy: propsValue.strategy },
    });
    const items = (data.productVariantsBulkCreate?.productVariants ?? []).map(shopifyMappers.mapVariant);
    return {
      product_id: data.productVariantsBulkCreate?.product?.id ?? productId,
      variants: items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
