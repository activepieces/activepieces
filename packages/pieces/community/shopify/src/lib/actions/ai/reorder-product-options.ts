import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { productDetailOutputSchema } from '../../output-schemas/products';

export const shopifyAiReorderProductOptions = createAction({
  auth: shopifyAuth,
  name: 'reorder_product_options',
  classification: 'WRITE',
  displayName: 'Reorder Product Options',
  description: 'Set the order of a product\'s options and, optionally, of their values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the absolute order of a product\'s options (and optionally the order of each option\'s values). List every option in the order you want; for each option you can list its value names in order. Variant order follows the new option order. Sending the same order again is safe.',
    idempotent: true,
  },
  outputSchema: productDetailOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options in Order',
      description: 'Every option of the product, first to last.',
      required: true,
      properties: {
        option_id: Property.ShortText({
          displayName: 'Option ID',
          description: 'The option id, for example "gid://shopify/ProductOption/1064576516". Use option_id for every option or name for every option; do not mix.',
          required: false,
        }),
        name: Property.ShortText({
          displayName: 'Option Name',
          description: 'The option name, for example "Size". Use it for every option when no option ids are given.',
          required: false,
        }),
        values: Property.ShortText({
          displayName: 'Values in Order',
          description: 'Optional comma-separated value names in the new order, for example "S, M, L".',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const options = shopifyValues.readRecords(propsValue.options).map((option) => {
      const optionId = shopifyValues.readText(option['option_id']);
      const name = shopifyValues.readText(option['name']);
      if (!optionId && !name) {
        throw new Error('Every option needs an option_id or a name.');
      }
      const values = shopifyValues.splitList(option['values']).map((value) => ({ name: value }));
      return shopifyValues.compact({
        id: optionId ? shopifyGraphqlClient.toGid({ type: 'ProductOption', id: optionId }) : undefined,
        name: optionId ? undefined : name,
        values: values.length > 0 ? values : undefined,
      });
    });
    if (options.length === 0) {
      throw new Error('Provide the options in their new order.');
    }
    const usesIds = options.some((option) => option['id'] !== undefined);
    const usesNames = options.some((option) => option['name'] !== undefined);
    if (usesIds && usesNames) {
      throw new Error('Identify every option the same way: all by option_id or all by name.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productOptionsReorder: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation ReorderProductOptions($productId: ID!, $options: [OptionReorderInput!]!) { productOptionsReorder(productId: $productId, options: $options) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message code } } }`,
      variables: { productId, options },
    });
    const product = data.productOptionsReorder?.product;
    if (!product) {
      throw new Error(`Product ${productId} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapProductDetail(product),
      redacted_fields: redactedFields,
    };
  },
});
