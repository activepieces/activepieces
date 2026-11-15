import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { COUPON_PAYMENT_METHODS, sallaMarketing } from '../../common/marketing';
import { sallaOutputSchemas } from '../../common/output-schemas';

const YES_NO = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const DEFAULT_YES_NO = [
  { label: 'Salla default', value: 'default' },
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export const aiCreateCouponAction = createAction({
  auth: sallaAuth,
  name: 'ai_create_coupon',
  classification: 'WRITE',
  displayName: 'Create Coupon',
  description: 'Creates a new discount coupon in the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Salla discount coupon from a code, a percentage or fixed amount and an expiry date, with optional start date, usage limits, minimum purchase, maximum discount and product, category, brand and customer group rules. Use List Coupons first to check the code is free; the expiry date must be at least tomorrow in store time (Asia/Riyadh) and the connection needs the Marketing scope. Not safe to retry: after a success, a second call fails because the code is already taken.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.coupon,
  props: {
    code: Property.ShortText({
      displayName: 'Code',
      description: 'Code customers type at checkout, letters and digits with no spaces, for example SUMMER10. Must not be used by another coupon.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'percentage takes amount percent off, fixed takes amount in the store currency off. For example percentage.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Percentage', value: 'percentage' },
          { label: 'Fixed Amount', value: 'fixed' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Discount Amount',
      description: 'Discount size, above 0, for example 10 for 10% (at most 100) or 10 SAR off for a fixed coupon.',
      required: true,
    }),
    expiry_date: Property.ShortText({
      displayName: 'Expiry Date',
      description:
        'Last day the coupon works, store time (Asia/Riyadh), format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS, for example 2026-12-31. A date with no time works until 23:59:59 that day. Must be at least tomorrow.',
      required: true,
    }),
    free_shipping: Property.StaticDropdown({
      displayName: 'Free Shipping',
      description: 'yes also makes shipping free for orders using the coupon, no does not. Default no.',
      required: false,
      defaultValue: 'no',
      options: { disabled: false, options: YES_NO },
    }),
    exclude_sale_products: Property.StaticDropdown({
      displayName: 'Exclude Sale Products',
      description: 'yes stops the coupon from applying to products that already have a sale price, no lets it apply. Default no.',
      required: false,
      defaultValue: 'no',
      options: { disabled: false, options: YES_NO },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description:
        'First day the coupon works, store time (Asia/Riyadh), format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS, for example 2026-12-01. Must be before expiry_date. Leave empty to start now.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'active or inactive. Leave empty for the Salla default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    applied_in: Property.StaticDropdown({
      displayName: 'Applies In',
      description: 'Where the coupon works: all, web (store website) or app (store mobile app). Leave empty for the Salla default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Website and App', value: 'all' },
          { label: 'Website Only', value: 'web' },
          { label: 'App Only', value: 'app' },
        ],
      },
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum Purchase Amount',
      description: 'Smallest cart total, in the store currency, that can use the coupon, for example 100.',
      required: false,
    }),
    maximum_amount: Property.Number({
      displayName: 'Maximum Discount Amount',
      description: 'Cap on the discount, in the store currency, for example 50. Required when type is percentage; ignored for fixed coupons.',
      required: false,
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'How many times the coupon can be used in total, a whole number, for example 100. Leave empty for no limit.',
      required: false,
    }),
    usage_limit_per_user: Property.Number({
      displayName: 'Usage Limit per Customer',
      description: 'How many times one customer can use the coupon, a whole number, for example 1. Leave empty for no limit.',
      required: false,
    }),
    apply_with_offer: Property.StaticDropdown({
      displayName: 'Applies With Offers',
      description: 'yes lets the coupon combine with the store\'s special offers, no does not, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    show_maximum_amount: Property.StaticDropdown({
      displayName: 'Show Maximum Discount',
      description: 'yes shows maximum_amount to customers, no hides it, default keeps the Salla default. Default default.',
      required: false,
      defaultValue: 'default',
      options: { disabled: false, options: DEFAULT_YES_NO },
    }),
    include_product_ids: Property.Array({
      displayName: 'Only These Product IDs',
      description: 'Numeric product IDs from List Products the coupon applies to, for example ["1672932878"]. Leave empty for all products.',
      required: false,
    }),
    exclude_product_ids: Property.Array({
      displayName: 'Excluded Product IDs',
      description: 'Numeric product IDs from List Products the coupon never applies to, for example ["1672932878"].',
      required: false,
    }),
    include_category_ids: Property.Array({
      displayName: 'Only These Category IDs',
      description: 'Numeric category IDs from List Categories the coupon applies to, for example ["1340423950"]. Leave empty for all categories.',
      required: false,
    }),
    exclude_category_ids: Property.Array({
      displayName: 'Excluded Category IDs',
      description: 'Numeric category IDs from List Categories the coupon never applies to, for example ["752848962"].',
      required: false,
    }),
    exclude_brand_ids: Property.Array({
      displayName: 'Excluded Brand IDs',
      description: 'Numeric brand IDs from List Brands the coupon never applies to, for example ["1473353380"].',
      required: false,
    }),
    include_customer_group_ids: Property.Array({
      displayName: 'Only These Customer Group IDs',
      description: 'Numeric customer group IDs from List Customer Groups that can use the coupon, for example ["1227534533"]. Leave empty for all customers.',
      required: false,
    }),
    exclude_customer_group_ids: Property.Array({
      displayName: 'Excluded Customer Group IDs',
      description: 'Numeric customer group IDs from List Customer Groups that cannot use the coupon, for example ["1227534533"].',
      required: false,
    }),
    payment_methods: Property.StaticMultiSelectDropdown({
      displayName: 'Payment Methods',
      description: `Payment methods the coupon works with, any of: ${COUPON_PAYMENT_METHODS.join(', ')}, for example ["mada", "credit_card"]. Leave empty for the Salla default.`,
      required: false,
      options: {
        disabled: false,
        options: COUPON_PAYMENT_METHODS.map((method) => ({ label: method, value: method })),
      },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.createCoupon({
      auth,
      input: {
        code: propsValue.code,
        type: propsValue.type,
        amount: propsValue.amount,
        expiryDate: propsValue.expiry_date,
        freeShipping: sallaUtils.triState(propsValue.free_shipping),
        excludeSaleProducts: sallaUtils.triState(propsValue.exclude_sale_products),
        startDate: propsValue.start_date,
        status: propsValue.status,
        appliedIn: propsValue.applied_in,
        minimumAmount: propsValue.minimum_amount ?? undefined,
        maximumAmount: propsValue.maximum_amount ?? undefined,
        usageLimit: propsValue.usage_limit ?? undefined,
        usageLimitPerUser: propsValue.usage_limit_per_user ?? undefined,
        applyWithOffer: sallaUtils.triState(propsValue.apply_with_offer),
        showMaximumAmount: sallaUtils.triState(propsValue.show_maximum_amount),
        includeProductIds: sallaUtils.toStringList(propsValue.include_product_ids),
        excludeProductIds: sallaUtils.toStringList(propsValue.exclude_product_ids),
        includeCategoryIds: sallaUtils.toStringList(propsValue.include_category_ids),
        excludeCategoryIds: sallaUtils.toStringList(propsValue.exclude_category_ids),
        excludeBrandIds: sallaUtils.toStringList(propsValue.exclude_brand_ids),
        includeCustomerGroupIds: sallaUtils.toStringList(propsValue.include_customer_group_ids),
        excludeCustomerGroupIds: sallaUtils.toStringList(propsValue.exclude_customer_group_ids),
        paymentMethods: sallaUtils.toStringList(propsValue.payment_methods),
      },
    });
  },
});
