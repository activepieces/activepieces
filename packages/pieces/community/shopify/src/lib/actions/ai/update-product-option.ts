import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateProductOption = createAction({
  auth: shopifyAuth,
  name: 'update_product_option',
  classification: 'WRITE',
  displayName: 'Update Product Option',
  description: 'Rename or move a product option and add, rename or delete its values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one product option: its name or position, and its values through explicit changes only (values to add, values to rename by id, value ids to delete). Values not mentioned stay as they are. Deleting a value that variants use needs variant_strategy MANAGE, which also removes those variants. Option and value ids come from get_product_details. Renaming to the same name again is safe; adding a value twice fails.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    option_id: Property.ShortText({
      displayName: 'Option ID',
      description: 'The option id, for example "gid://shopify/ProductOption/1064576516". Find it with get_product_details.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New option name, for example "Colour".',
      required: false,
    }),
    position: Property.Number({
      displayName: 'New Position',
      description: 'New position of the option, starting at 1.',
      required: false,
    }),
    values_to_add: Property.Array({
      displayName: 'Values to Add',
      description: 'New values for this option, for example ["Purple"].',
      required: false,
    }),
    values_to_rename: Property.Array({
      displayName: 'Values to Rename',
      description: 'Existing values to rename.',
      required: false,
      properties: {
        value_id: Property.ShortText({
          displayName: 'Value ID',
          description: 'The option value id, for example "gid://shopify/ProductOptionValue/1054672275".',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'New Name',
          description: 'New value name, for example "Navy".',
          required: true,
        }),
      },
    }),
    value_ids_to_delete: Property.Array({
      displayName: 'Value IDs to Delete',
      description: 'Ids of option values to delete.',
      required: false,
    }),
    variant_strategy: Property.StaticDropdown({
      displayName: 'Variant Strategy',
      description: 'How variants follow value changes. Leave empty for the Shopify default (leave variants as they are).',
      required: false,
      options: {
        options: [
          { label: 'Leave variants as they are', value: 'LEAVE_AS_IS' },
          { label: 'Manage variants (create and delete as needed)', value: 'MANAGE' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const optionId = shopifyGraphqlClient.toGid({ type: 'ProductOption', id: propsValue.option_id });
    const valuesToAdd = (shopifyValues.readStringList(propsValue.values_to_add) ?? []).map((name) => ({ name }));
    const valuesToRename = shopifyValues.readRecords(propsValue.values_to_rename).map((item) => {
      const valueId = shopifyValues.readText(item['value_id']);
      const name = shopifyValues.readText(item['name']);
      if (!valueId || !name) {
        throw new Error('Every value to rename needs a value_id and a name.');
      }
      return { id: shopifyGraphqlClient.toGid({ type: 'ProductOptionValue', id: valueId }), name };
    });
    const valueIdsToDelete = shopifyValues.toGidList({ type: 'ProductOptionValue', value: propsValue.value_ids_to_delete });
    const optionPatch = shopifyValues.compact({
      name: shopifyValues.nonEmpty(propsValue.name),
      position: shopifyValues.readNumber(propsValue.position),
    });
    if (
      Object.keys(optionPatch).length === 0 &&
      valuesToAdd.length === 0 &&
      valuesToRename.length === 0 &&
      !valueIdsToDelete
    ) {
      throw new Error('Provide at least one change: a new name, a position, or values to add, rename or delete.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productOptionUpdate: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation UpdateProductOption($productId: ID!, $option: OptionUpdateInput!, $optionValuesToAdd: [OptionValueCreateInput!], $optionValuesToUpdate: [OptionValueUpdateInput!], $optionValuesToDelete: [ID!], $variantStrategy: ProductOptionUpdateVariantStrategy) { productOptionUpdate(productId: $productId, option: $option, optionValuesToAdd: $optionValuesToAdd, optionValuesToUpdate: $optionValuesToUpdate, optionValuesToDelete: $optionValuesToDelete, variantStrategy: $variantStrategy) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message code } } }`,
      variables: shopifyValues.compact({
        productId,
        option: { id: optionId, ...optionPatch },
        optionValuesToAdd: valuesToAdd.length > 0 ? valuesToAdd : undefined,
        optionValuesToUpdate: valuesToRename.length > 0 ? valuesToRename : undefined,
        optionValuesToDelete: valueIdsToDelete,
        variantStrategy: propsValue.variant_strategy,
      }),
    });
    const product = data.productOptionUpdate?.product;
    if (!product) {
      throw new Error(`Product ${productId} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapProductDetail(product),
      redacted_fields: redactedFields,
    };
  },
});
