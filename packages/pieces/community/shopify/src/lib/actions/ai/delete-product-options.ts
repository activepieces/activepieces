import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { deleteProductOptionsOutputSchema } from '../../output-schemas/products';

export const shopifyAiDeleteProductOptions = createAction({
  auth: shopifyAuth,
  name: 'delete_product_options',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product Options',
  description: 'Delete one or more options from a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes options from a product. The strategy is required because it decides what happens to variants: NON_DESTRUCTIVE deletes only when no variant has to be deleted, DEFAULT deletes only options that have a single value, POSITION also deletes options with several values and removes the variants that become duplicates, keeping the one with the lowest position. Option ids come from get_product_details. Cannot be undone; a repeat call fails because the options are gone.',
    idempotent: false,
  },
  outputSchema: deleteProductOptionsOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    option_ids: Property.Array({
      displayName: 'Option IDs',
      description: 'Ids of the options to delete, for example ["gid://shopify/ProductOption/1064576516"].',
      required: true,
    }),
    strategy: Property.StaticDropdown({
      displayName: 'Variant Strategy',
      description: 'What happens to variants when the options are removed.',
      required: true,
      options: {
        options: [
          { label: 'Refuse if any variant would be deleted', value: 'NON_DESTRUCTIVE' },
          { label: 'Default (only options with a single value)', value: 'DEFAULT' },
          { label: 'Delete duplicate variants, keep the lowest position', value: 'POSITION' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const options = shopifyValues.toGidList({ type: 'ProductOption', value: propsValue.option_ids });
    if (!options) {
      throw new Error('Provide at least one option id to delete.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productOptionsDelete: { deletedOptionsIds?: string[] | null; product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation DeleteProductOptions($productId: ID!, $options: [ID!]!, $strategy: ProductOptionDeleteStrategy) { productOptionsDelete(productId: $productId, options: $options, strategy: $strategy) { deletedOptionsIds product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message code } } }`,
      variables: { productId, options, strategy: propsValue.strategy },
    });
    const product = data.productOptionsDelete?.product;
    if (!product) {
      throw new Error(`Product ${productId} was not returned by Shopify.`);
    }
    return {
      deleted_option_ids: data.productOptionsDelete?.deletedOptionsIds ?? [],
      ...shopifyMappers.mapProductDetail(product),
      redacted_fields: redactedFields,
    };
  },
});
