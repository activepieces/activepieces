import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { createCouponOutputSchema } from '../../output-schemas';

export const wooAiCreateCoupon = createAction({
  name: 'create_coupon',
  classification: 'WRITE',
  displayName: 'Create Coupon',
  description: 'Create a discount coupon.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a discount coupon with a code, discount type and amount; optional limits and restrictions are only applied when given. Coupon codes must be unique, and a code that already exists is rejected, so check list_coupons with the code first. Each call creates a new coupon.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createCouponOutputSchema,
  props: {
    code: Property.ShortText({
      displayName: 'Code',
      description: 'Coupon code customers enter at checkout. Must be unique.',
      required: true,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'Percentage off the cart, a fixed amount off the cart, or a fixed amount off each product.',
      required: true,
      options: {
        options: [
          { label: 'Percentage discount', value: 'percent' },
          { label: 'Fixed cart discount', value: 'fixed_cart' },
          { label: 'Fixed product discount', value: 'fixed_product' },
        ],
      },
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Discount amount as a decimal string: a percentage for percentage coupons, otherwise money, e.g. 10.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal description of the coupon.',
      required: false,
    }),
    date_expires: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'The coupon stops working after this date.',
      required: false,
    }),
    minimum_amount: Property.ShortText({
      displayName: 'Minimum Spend',
      description: 'Minimum cart subtotal needed to use the coupon, e.g. 50.00.',
      required: false,
    }),
    maximum_amount: Property.ShortText({
      displayName: 'Maximum Spend',
      description: 'Maximum cart subtotal allowed when using the coupon.',
      required: false,
    }),
    individual_use: wooProps.triStateProp({
      displayName: 'Individual Use Only',
      description: 'Yes stops this coupon from being combined with other coupons. Leave empty for the store default (No).',
    }),
    exclude_sale_items: wooProps.triStateProp({
      displayName: 'Exclude Sale Items',
      description: 'Yes stops the coupon from applying to items already on sale. Leave empty for the store default (No).',
    }),
    free_shipping: wooProps.triStateProp({
      displayName: 'Free Shipping',
      description: 'Yes lets the coupon unlock free shipping, if a free-shipping method is set up. Leave empty for the store default (No).',
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'How many times the coupon can be used in total.',
      required: false,
    }),
    usage_limit_per_user: Property.Number({
      displayName: 'Usage Limit Per Customer',
      description: 'How many times each customer can use the coupon.',
      required: false,
    }),
    product_ids: Property.Array({
      displayName: 'Product IDs',
      description: 'Ids of the only products the coupon applies to.',
      required: false,
    }),
    excluded_product_ids: Property.Array({
      displayName: 'Excluded Product IDs',
      description: 'Ids of products the coupon never applies to.',
      required: false,
    }),
    email_restrictions: Property.Array({
      displayName: 'Allowed Emails',
      description: 'Only customers with these billing emails can use the coupon.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const amount = props.amount.trim();
    if (amount.length === 0 || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      throw new Error(`Amount must be a non-negative decimal number such as 10; got "${props.amount}".`);
    }
    const body = wooValues.pruneUndefined({
      code: props.code.trim(),
      discount_type: props.discount_type,
      amount,
      description: wooValues.nonEmpty(props.description),
      date_expires: wooValues.nonEmpty(props.date_expires),
      minimum_amount: wooValues.nonEmpty(props.minimum_amount),
      maximum_amount: wooValues.nonEmpty(props.maximum_amount),
      individual_use: wooValues.resolveTriState(props.individual_use),
      exclude_sale_items: wooValues.resolveTriState(props.exclude_sale_items),
      free_shipping: wooValues.resolveTriState(props.free_shipping),
      usage_limit: props.usage_limit ?? undefined,
      usage_limit_per_user: props.usage_limit_per_user ?? undefined,
      product_ids: wooValues.toIdList(props.product_ids),
      excluded_product_ids: wooValues.toIdList(props.excluded_product_ids),
      email_restrictions: wooValues.toStringList(props.email_restrictions),
    });
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/coupons',
      body,
    });
  },
});
