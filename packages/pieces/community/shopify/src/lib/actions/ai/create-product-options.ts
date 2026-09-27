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

export const shopifyAiCreateProductOptions = createAction({
  auth: shopifyAuth,
  name: 'create_product_options',
  classification: 'WRITE',
  displayName: 'Create Product Options',
  description: 'Add new options (such as Size or Color) and their values to a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more options with their values to a product (a product can have up to 3 options). With variant_strategy LEAVE_AS_IS (the default) existing variants get the first value of each new option and no variants are added; CREATE also creates a variant for every new value combination. Returns the product with its options and variants. Adding an option that already exists fails, so do not blindly retry.',
    idempotent: false,
  },
  outputSchema: productDetailOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'The options to add, for example Color with values "Red, Blue".',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Option Name',
          description: 'Option name, for example "Color".',
          required: true,
        }),
        values: Property.ShortText({
          displayName: 'Values',
          description: 'Comma-separated values, for example "Red, Blue, Green".',
          required: true,
        }),
        position: Property.Number({
          displayName: 'Position',
          description: 'Optional position of the option, starting at 1.',
          required: false,
        }),
      },
    }),
    variant_strategy: Property.StaticDropdown({
      displayName: 'Variant Strategy',
      description: 'What happens to variants. Defaults to leaving existing variants as they are.',
      required: false,
      options: {
        options: [
          { label: 'Leave variants as they are', value: 'LEAVE_AS_IS' },
          { label: 'Create variants for every new combination', value: 'CREATE' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const options = shopifyValues.readRecords(propsValue.options).map((option) => {
      const name = shopifyValues.readText(option['name']);
      const values = shopifyValues.splitList(option['values']);
      if (!name || values.length === 0) {
        throw new Error('Every option needs a name and at least one value.');
      }
      return shopifyValues.compact({
        name,
        position: shopifyValues.readNumber(option['position']),
        values: values.map((value) => ({ name: value })),
      });
    });
    if (options.length === 0) {
      throw new Error('Provide at least one option to create.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productOptionsCreate: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation CreateProductOptions($productId: ID!, $options: [OptionCreateInput!]!, $variantStrategy: ProductOptionCreateVariantStrategy) { productOptionsCreate(productId: $productId, options: $options, variantStrategy: $variantStrategy) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message code } } }`,
      variables: {
        productId,
        options,
        variantStrategy: propsValue.variant_strategy ?? 'LEAVE_AS_IS',
      },
    });
    const product = data.productOptionsCreate?.product;
    if (!product) {
      throw new Error(`Product ${productId} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapProductDetail(product),
      redacted_fields: redactedFields,
    };
  },
});
