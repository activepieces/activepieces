import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import {
  COUPON_APPLIED_IN,
  COUPON_PAYMENT_METHODS,
  COUPON_STATUSES,
  CouponAppliedIn,
  CouponStatus,
  CouponType,
  sallaMarketing,
} from '../common/marketing';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const createCouponAction = createAction({
  auth: sallaAuth,
  name: 'create_coupon',
  classification: 'WRITE',
  displayName: 'Create Coupon',
  description:
    'Creates a discount coupon customers type at checkout. The expiry date must be at least one day after today in store time. The Salla app needs the Marketing scope.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one Salla coupon with a code, a percentage or fixed discount and an expiry date, plus optional limits and the products, categories, customer groups and payment methods it applies to. Use Find Coupons first to check the code is not taken. The expiry must be at least one day after today (Asia/Riyadh); each call creates a coupon, so a retry fails on the taken code or duplicates it.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.coupon,
  propertyGroups: [
    {
      key: 'discount',
      display: 'section',
      label: 'Discount',
      icon: 'tag',
      props: ['code', 'type', 'amount', 'maximum_amount', 'free_shipping', 'exclude_sale_products'],
    },
    {
      key: 'limits',
      display: 'section',
      label: 'Limits',
      description: 'The expiry date must be at least one day after today in store time (Asia/Riyadh).',
      icon: 'calendar',
      props: ['expiry_date', 'start_date', 'minimum_amount', 'usage_limit', 'usage_limit_per_user'],
    },
    {
      key: 'applies_to',
      display: 'section',
      label: 'Applies To',
      description: 'Leave these empty to let the coupon work on every product, customer and payment method.',
      icon: 'filter',
      props: ['include_product_ids', 'include_categories', 'include_customer_groups', 'payment_methods'],
    },
  ],
  props: {
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The code customers type at checkout, letters and digits without spaces, for example SUMMER10. Must not be used by another coupon.',
      placeholder: 'SUMMER10',
      width: 'half',
      required: true,
    }),
    type: Property.StaticDropdown<CouponType, true>({
      displayName: 'Discount Type',
      description: 'Percentage takes a percent off the order, for example 10%. Fixed takes an amount off in the store currency, for example 10 SAR.',
      display: 'cards',
      required: true,
      defaultValue: 'percentage',
      options: {
        options: [
          { label: 'Percentage', value: 'percentage', description: 'A percent off, for example 10%.', icon: 'tag' },
          { label: 'Fixed amount', value: 'fixed', description: 'An amount off in the store currency, for example 10 SAR.', icon: 'tag' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Discount Amount',
      description: 'How much the coupon takes off, greater than 0: a percent for Percentage (up to 100, for example 10) or money for Fixed (for example 25).',
      placeholder: '10',
      width: 'half',
      required: true,
    }),
    maximum_amount: Property.Number({
      displayName: 'Maximum Discount',
      description: 'The most a Percentage coupon can take off, in the store currency, for example 50. Required for Percentage coupons; ignored for Fixed ones.',
      placeholder: '50',
      width: 'half',
      required: false,
    }),
    free_shipping: Property.Checkbox({
      displayName: 'Free Shipping',
      description: 'Also give free shipping on orders that use this coupon.',
      required: false,
      defaultValue: false,
    }),
    exclude_sale_products: Property.Checkbox({
      displayName: 'Exclude Sale Products',
      description: 'Do not apply the discount to products that already have a sale price.',
      required: false,
      defaultValue: false,
    }),
    expiry_date: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'Last day the coupon works, in store time (Asia/Riyadh), at least one day after today, for example 2026-12-31. With no time set, it works until 23:59:59 that day.',
      width: 'half',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day the coupon works, in store time (Asia/Riyadh), before the expiry date, for example 2026-12-01. Leave empty to start now.',
      width: 'half',
      required: false,
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum Purchase',
      description: 'Smallest order total, in the store currency, the coupon works on, for example 100. Leave empty for no minimum.',
      placeholder: '100',
      width: 'half',
      required: false,
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'How many times the coupon can be used in total, a whole number such as 500. Leave empty for no limit.',
      placeholder: '500',
      width: 'half',
      required: false,
    }),
    usage_limit_per_user: Property.Number({
      displayName: 'Usage Limit per Customer',
      description: 'How many times one customer can use the coupon, a whole number such as 1. Leave empty for no limit.',
      placeholder: '1',
      width: 'half',
      required: false,
    }),
    include_product_ids: Property.Array({
      displayName: 'Only These Products',
      description: 'Numeric product IDs the coupon works on, one per row, for example 1672932878. Use Find Products to get them. Leave empty for all products.',
      required: false,
    }),
    include_categories: sallaProps.categories({
      required: false,
      displayName: 'Only These Categories',
      description: 'Categories the coupon works on, for example Clothes > Shirts. In a flow, map numeric category IDs such as 1937598462. Leave empty for all categories.',
    }),
    include_customer_groups: sallaProps.customerGroups({
      required: false,
      displayName: 'Only These Customer Groups',
      description: 'Customer groups that can use the coupon, for example VIP Customers. In a flow, map numeric group IDs such as 1226617469. Leave empty for everyone.',
    }),
    payment_methods: Property.StaticMultiSelectDropdown<string, false>({
      displayName: 'Payment Methods',
      description: 'Payment methods the coupon works with, for example mada and Apple Pay. Leave empty for all methods.',
      required: false,
      options: { options: paymentMethodOptions() },
    }),
    status: Property.StaticDropdown<CouponStatus, false>({
      displayName: 'Status',
      description: 'Active coupons work right away; Inactive ones wait until you turn them on in Salla. Leave empty for Salla\'s default.',
      advanced: true,
      required: false,
      options: { options: COUPON_STATUSES.map((status) => ({ label: status === 'active' ? 'Active' : 'Inactive', value: status })) },
    }),
    applied_in: Property.StaticDropdown<CouponAppliedIn, false>({
      displayName: 'Works In',
      description: 'Where customers can use the coupon: the website, the store app, or both. Leave empty for Salla\'s default.',
      advanced: true,
      required: false,
      options: { options: appliedInOptions() },
    }),
    apply_with_offer: {
      ...sallaProps.triState({
        displayName: 'Works With Special Offers',
        description: 'Whether the coupon can be used on orders that already get a special offer.',
        unchangedLabel: 'Salla default',
      }),
      advanced: true,
    },
    show_maximum_amount: {
      ...sallaProps.triState({
        displayName: 'Show Maximum Discount',
        description: 'Whether customers see the Maximum Discount cap at checkout.',
        unchangedLabel: 'Salla default',
      }),
      advanced: true,
    },
    exclude_product_ids: Property.Array({
      displayName: 'Exclude Products',
      description: 'Numeric product IDs the coupon never works on, one per row, for example 1672932878.',
      advanced: true,
      required: false,
    }),
    exclude_categories: {
      ...sallaProps.categories({
        required: false,
        displayName: 'Exclude Categories',
        description: 'Categories the coupon never works on, for example Clothes > Shirts. In a flow, map numeric category IDs such as 1937598462.',
      }),
      advanced: true,
    },
    exclude_brand_ids: Property.Array({
      displayName: 'Exclude Brands',
      description: 'Numeric brand IDs the coupon never works on, one per row, for example 1473353380.',
      advanced: true,
      required: false,
    }),
    exclude_customer_groups: {
      ...sallaProps.customerGroups({
        required: false,
        displayName: 'Exclude Customer Groups',
        description: 'Customer groups that cannot use the coupon, for example Wholesale. In a flow, map numeric group IDs such as 1226617469.',
      }),
      advanced: true,
    },
    exclude_shipping_company_ids: Property.Array({
      displayName: 'Exclude Shipping Companies',
      description: 'Numeric shipping company IDs the coupon does not work with, one per row, for example 1723506348.',
      advanced: true,
      required: false,
    }),
    beneficiary_domain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'Only customers whose email ends with this domain can use the coupon, for example company.com.',
      placeholder: 'company.com',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.createCoupon({
      auth,
      input: {
        code: propsValue.code,
        type: propsValue.type,
        amount: propsValue.amount,
        expiryDate: sallaUtils.wallClockFromDateTimeProp(propsValue.expiry_date) ?? '',
        freeShipping: propsValue.free_shipping === true,
        excludeSaleProducts: propsValue.exclude_sale_products === true,
        startDate: sallaUtils.wallClockFromDateTimeProp(propsValue.start_date),
        status: propsValue.status ?? undefined,
        appliedIn: propsValue.applied_in ?? undefined,
        minimumAmount: propsValue.minimum_amount ?? undefined,
        maximumAmount: propsValue.maximum_amount ?? undefined,
        usageLimit: propsValue.usage_limit ?? undefined,
        usageLimitPerUser: propsValue.usage_limit_per_user ?? undefined,
        applyWithOffer: propsValue.apply_with_offer ?? undefined,
        showMaximumAmount: propsValue.show_maximum_amount ?? undefined,
        includeProductIds: idRows(propsValue.include_product_ids),
        excludeProductIds: idRows(propsValue.exclude_product_ids),
        includeCategoryIds: propsValue.include_categories ?? [],
        excludeCategoryIds: propsValue.exclude_categories ?? [],
        excludeBrandIds: idRows(propsValue.exclude_brand_ids),
        includeCustomerGroupIds: propsValue.include_customer_groups ?? [],
        excludeCustomerGroupIds: propsValue.exclude_customer_groups ?? [],
        excludeShippingCompanyIds: idRows(propsValue.exclude_shipping_company_ids),
        paymentMethods: propsValue.payment_methods ?? [],
        beneficiaryDomain: propsValue.beneficiary_domain ?? undefined,
      },
    });
  },
});

function idRows(value: unknown[] | undefined | null): Array<string | number> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string | number => typeof entry === 'string' || typeof entry === 'number');
}

function appliedInOptions(): Array<{ label: string; value: CouponAppliedIn }> {
  const labels: Record<CouponAppliedIn, string> = {
    all: 'Website and app',
    web: 'Website only',
    app: 'App only',
  };
  return COUPON_APPLIED_IN.map((channel) => ({ label: labels[channel], value: channel }));
}

function paymentMethodOptions(): Array<{ label: string; value: string }> {
  const labels: Record<string, string | undefined> = {
    all: 'All methods',
    apple_pay: 'Apple Pay',
    bank: 'Bank transfer',
    cod: 'Cash on delivery',
    credit_card: 'Credit card',
    knet: 'KNET',
    mada: 'mada',
    paypal: 'PayPal',
    spotii_pay: 'Spotii',
    stc_pay: 'STC Pay',
    tabby_installment: 'Tabby installments',
    tamara_installment: 'Tamara installments',
  };
  return COUPON_PAYMENT_METHODS.map((method) => ({ label: labels[method] ?? method, value: method }));
}

