import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { couponCodeDropdown, formSlugOrIdDropdown } from '../common/props';

export const updateFormCoupon = createAction({
  auth: PaperformAuth,
  name: 'updateFormCoupon',
  displayName: 'Update Form Coupon',
  description: 'Update an existing coupon for a specific form',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    coupon_code: couponCodeDropdown,
    target: Property.StaticDropdown({
      displayName: 'Target',
      description: 'What the coupon applies to',
      required: false,
      options: {
        options: [{ label: 'Price', value: 'price' }],
      },
    }),
    discount_amount: Property.Number({
      displayName: 'Discount Amount',
      description:
        'The fixed discount amount (only used when discount type is "amount")',
      required: false,
    }),
    discount_percentage: Property.Number({
      displayName: 'Discount Percentage',
      description:
        'The discount percentage (only used when discount type is "percentage")',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled',
      required: false,
    }),
    expires_at: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the coupon expires (optional)',
      required: false,
    }),
  },
  async run(context) {
    const {
      slug_or_id,
      coupon_code,
      target,

      discount_amount,
      discount_percentage,
      enabled,
      expires_at,
    } = context.propsValue;
    const apiKey = context.auth as string;

    const couponData: any = {};

    if (target !== undefined) {
      couponData.target = target;
    }

    if (enabled !== undefined) {
      couponData.enabled = enabled;
    }
    if (discount_amount !== undefined) {
      couponData.discountAmount = discount_amount;
    }
    if (discount_percentage !== undefined) {
      couponData.discountPercentage = discount_percentage;
    }
    // Add expiry date if provided
    if (expires_at !== undefined) {
      couponData.expiresAt = expires_at
        ? new Date(expires_at).toISOString()
        : null;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.PUT,
      `/forms/${slug_or_id}/coupons/${coupon_code}`,
      couponData
    );

    return {
      success: true,
      message: `Successfully updated coupon ${coupon_code} for form ${slug_or_id}`,
      coupon: response.result.coupon,
    };
  },
});
