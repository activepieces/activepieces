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
import { discountTargets } from './ai-create-product-discount';

export const aiCreatePromoCodeAction = createAction({
  auth: quickzuAuth,
  name: 'ai_create_promo_code',
  outputSchema: quickzuOutputSchemas.discount,
  classification: 'WRITE',
  displayName: 'Create Promo Code',
  description: 'Creates a promo/coupon code shoppers enter at checkout.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a promo/coupon code in a Quickzu store that shoppers enter at checkout to get a subtotal discount between Valid From and Valid To (YYYY-MM-DD), with a minimum cart value and a maximum number of uses. Set Applies To to PRODUCTS with Product IDs, CATEGORIES with Category IDs, or ALL_PRODUCTS with no IDs; get IDs from List Products or List Categories. Value Type PERCENTAGE takes a percent, FLAT an amount off. For an automatic discount with no code use Create Product Discount instead. Not idempotent: each call creates a separate promo even with the same code.',
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
    promo_code: Property.ShortText({
      displayName: 'Promo Code',
      description: 'Code shoppers enter at checkout, e.g. "SAVE10".',
      required: true,
    }),
    minimum_cart_value: Property.Number({
      displayName: 'Minimum Cart Value',
      description: 'Smallest cart subtotal the code accepts. Use 0 for no minimum.',
      required: true,
    }),
    max_users_limit: Property.Number({
      displayName: 'Maximum Uses',
      description: 'How many times the code can be redeemed in total.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Value Type',
      description: 'PERCENTAGE or FLAT (amount off).',
      required: true,
      options: {
        disabled: false,
        options: Object.values(DiscountValueType)
          .filter((value) => value !== DiscountValueType.FIXED_PRICE)
          .map((value) => ({ label: value, value })),
      },
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Percent or amount off, depending on Value Type.',
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
      discount_method: DiscountMethod.SUB_TOTAL,
      title: p.title,
      start_date: toQuickzuDate(p.start_date),
      end_date: toQuickzuDate(p.end_date),
      filter_type: p.filter_type,
      promo_code: p.promo_code,
      minimum_cart_value: p.minimum_cart_value,
      max_users_limit: p.max_users_limit,
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
