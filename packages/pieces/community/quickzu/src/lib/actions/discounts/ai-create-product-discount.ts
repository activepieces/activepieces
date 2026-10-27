import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { quickzuOutputSchemas } from '../../common/output-schemas';
import { makeClient, toQuickzuDate } from '../../common';
import {
  DiscountFilterType,
  DiscountMethod,
  DiscountValueType,
} from '../../common/constants';
import { ProductDiscountInput } from '../../common/types';

export const aiCreateProductDiscountAction = createAction({
  auth: quickzuAuth,
  name: 'ai_create_product_discount',
  outputSchema: quickzuOutputSchemas.discount,
  classification: 'WRITE',
  displayName: 'Create Product Discount',
  description: 'Creates an automatic item-level discount for products, categories or the whole store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an automatic item-level discount in a Quickzu store that applies without a code between Valid From and Valid To (YYYY-MM-DD). Set Applies To to PRODUCTS with Product IDs, CATEGORIES with Category IDs, or ALL_PRODUCTS with no IDs; get IDs from List Products or List Categories. Value Type PERCENTAGE takes a percent, FLAT an amount off, FIXED_PRICE the new price. For a code shoppers type at checkout use Create Promo Code instead. Not idempotent: each call creates a separate discount.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of the discount shown to shoppers, e.g. "Summer Sale".',
      required: true,
    }),
    start_date: Property.ShortText({
      displayName: 'Valid From',
      description: 'First day the discount applies, in YYYY-MM-DD format.',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'Valid To',
      description: 'Last day the discount applies, in YYYY-MM-DD format.',
      required: true,
    }),
    filter_type: Property.StaticDropdown({
      displayName: 'Applies To',
      description: 'PRODUCTS needs Product IDs, CATEGORIES needs Category IDs, ALL_PRODUCTS needs neither.',
      required: true,
      options: {
        disabled: false,
        options: Object.values(DiscountFilterType).map((value) => ({ label: value, value })),
      },
    }),
    product_ids: Property.Array({
      displayName: 'Product IDs',
      description: 'Product IDs (the _id from List Products). Required when Applies To is PRODUCTS.',
      required: false,
    }),
    category_ids: Property.Array({
      displayName: 'Category IDs',
      description: 'Category IDs (the _id from List Categories). Required when Applies To is CATEGORIES.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Value Type',
      description: 'PERCENTAGE, FLAT (amount off) or FIXED_PRICE (new price).',
      required: true,
      options: {
        disabled: false,
        options: Object.values(DiscountValueType).map((value) => ({ label: value, value })),
      },
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Percent, amount off or fixed price, depending on Value Type.',
      required: true,
    }),
    is_enabled: Property.Checkbox({
      displayName: 'Enabled',
      required: false,
      defaultValue: true,
    }),
    is_visible: Property.Checkbox({
      displayName: 'Visible',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const input: ProductDiscountInput = {
      discount_method: DiscountMethod.ITEM_LEVEL,
      title: p.title,
      start_date: toQuickzuDate(p.start_date),
      end_date: toQuickzuDate(p.end_date),
      filter_type: p.filter_type,
      type: p.type,
      value: p.value,
      is_enabled: p.is_enabled ?? true,
      is_visible: p.is_visible ?? true,
      ...discountTargets({
        filterType: p.filter_type,
        productIds: p.product_ids,
        categoryIds: p.category_ids,
      }),
    };
    return await makeClient(context.auth).createDiscount(input);
  },
});

export function discountTargets({
  filterType,
  productIds,
  categoryIds,
}: {
  filterType: DiscountFilterType;
  productIds: unknown[] | undefined;
  categoryIds: unknown[] | undefined;
}): Pick<ProductDiscountInput, 'selectedProducts' | 'selectedCategories'> {
  if (filterType === DiscountFilterType.PRODUCTS) {
    return { selectedProducts: requireIds({ ids: productIds, label: 'Product IDs', filterType }) };
  }
  if (filterType === DiscountFilterType.CATEGORIES) {
    return { selectedCategories: requireIds({ ids: categoryIds, label: 'Category IDs', filterType }) };
  }
  return {};
}

function requireIds({
  ids,
  label,
  filterType,
}: {
  ids: unknown[] | undefined;
  label: string;
  filterType: DiscountFilterType;
}): string[] {
  const cleaned = (ids ?? [])
    .map((id) => (typeof id === 'string' || typeof id === 'number' ? String(id).trim() : ''))
    .filter((id) => id.length > 0);
  if (cleaned.length === 0) {
    throw new Error(`${label} must contain at least one ID when Applies To is ${filterType}.`);
  }
  return cleaned;
}
