import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlInventoryItem,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateInventoryItem = createAction({
  auth: shopifyAuth,
  name: 'update_inventory_item',
  classification: 'WRITE',
  displayName: 'Update Inventory Item',
  description: 'Change the SKU, unit cost, tracking, shipping, weight or customs data of an inventory item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one inventory item; fields left empty are not sent and keep their values. Turning tracking off stops Shopify from counting stock for the variant. Quantities are not changed here; use set_inventory_quantities or adjust_inventory_quantities. Needs the write_inventory access scope. Re-running with the same values is safe.',
    idempotent: true,
  },
  props: {
    inventory_item_id: Property.ShortText({
      displayName: 'Inventory Item ID',
      description: 'The inventory item id, numeric or "gid://shopify/InventoryItem/…" (from get_product_variant_details).',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'New SKU, for example "TSHIRT-RED-L".',
      required: false,
    }),
    cost: Property.Number({
      displayName: 'Unit Cost',
      description: 'New unit cost in the shop currency, for example 7.50.',
      required: false,
    }),
    tracked: shopifyProps.booleanChoice({
      displayName: 'Track Quantity',
      description: 'Whether Shopify tracks stock for this item. Leave empty to keep the current setting.',
    }),
    requires_shipping: shopifyProps.booleanChoice({
      displayName: 'Requires Shipping',
      description: 'Whether the item is a physical product that needs shipping. Leave empty to keep the current setting.',
    }),
    country_code_of_origin: Property.ShortText({
      displayName: 'Country of Origin',
      description: 'Two-letter ISO country code where the item was made, for example "CN".',
      required: false,
    }),
    province_code_of_origin: Property.ShortText({
      displayName: 'Province of Origin',
      description: 'Province or state code of origin, for example "ON".',
      required: false,
    }),
    harmonized_system_code: Property.ShortText({
      displayName: 'HS Code',
      description: 'Harmonized System code for customs, for example "6109.10".',
      required: false,
    }),
    weight_value: Property.Number({
      displayName: 'Weight',
      description: 'Item weight, for example 0.25. Set together with the weight unit.',
      required: false,
    }),
    weight_unit: Property.StaticDropdown({
      displayName: 'Weight Unit',
      description: 'Unit of the weight.',
      required: false,
      options: {
        options: [
          { label: 'Kilograms', value: 'KILOGRAMS' },
          { label: 'Grams', value: 'GRAMS' },
          { label: 'Pounds', value: 'POUNDS' },
          { label: 'Ounces', value: 'OUNCES' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const weightValue = shopifyValues.readNumber(propsValue.weight_value);
    const weightUnit = propsValue.weight_unit;
    if ((weightValue === undefined) !== (weightUnit === undefined || weightUnit === null)) {
      throw new Error('Set both weight_value and weight_unit to change the weight.');
    }
    const countryCode = shopifyValues.nonEmpty(propsValue.country_code_of_origin)?.toUpperCase();
    if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error('country_code_of_origin must be a two-letter ISO country code, for example "CN".');
    }
    const cost = shopifyValues.readNumber(propsValue.cost);
    const input = shopifyValues.compact({
      sku: shopifyValues.nonEmpty(propsValue.sku),
      cost: cost !== undefined ? String(cost) : undefined,
      tracked: shopifyValues.toBooleanChoice(propsValue.tracked),
      requiresShipping: shopifyValues.toBooleanChoice(propsValue.requires_shipping),
      countryCodeOfOrigin: countryCode,
      provinceCodeOfOrigin: shopifyValues.nonEmpty(propsValue.province_code_of_origin),
      harmonizedSystemCode: shopifyValues.nonEmpty(propsValue.harmonized_system_code),
      measurement:
        weightValue !== undefined && weightUnit ? { weight: { value: weightValue, unit: weightUnit } } : undefined,
    });
    if (Object.keys(input).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: propsValue.inventory_item_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      inventoryItemUpdate: { inventoryItem: GqlInventoryItem | null } | null;
    }>({
      auth,
      query: `mutation UpdateInventoryItem($id: ID!, $input: InventoryItemInput!) { inventoryItemUpdate(id: $id, input: $input) { inventoryItem { ${shopifyFields.INVENTORY_ITEM_FIELDS} } userErrors { field message } } }`,
      variables: { id, input },
    });
    const item = data.inventoryItemUpdate?.inventoryItem;
    if (!item) {
      throw new Error(`Inventory item ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapInventoryItem(item),
      redacted_fields: redactedFields,
    };
  },
});
