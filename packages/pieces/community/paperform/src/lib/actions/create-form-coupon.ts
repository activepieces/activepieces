import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown, targetDropdown } from '../common/props';

export const createFormCoupon = createAction({
  auth: PaperformAuth,
  name: 'createFormCoupon',
  displayName: 'Create Form Coupon',
  description: 'Create a coupon for a specific form',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'The coupon code (must be unique)',
      required: true,
    }),
    target: targetDropdown,
    discount_amount: Property.Number({
      displayName: 'Discount Amount',
      description: 'The discount amount (must be positive)',
      required: true,
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
      defaultValue: true,
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
      code,
      target,
      discount_amount,
      discount_percentage,
      enabled,
      expires_at,
    } = context.propsValue;
    const apiKey = context.auth as string;

    const couponData: any = {
      code,
      target,
      enabled: enabled ?? true,
      discountAmount: discount_amount,
      discountPercentage: discount_percentage,
      expires_at: expires_at ? new Date(expires_at).toISOString() : undefined,
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/forms/${slug_or_id}/coupons`,
      couponData
    );

    return {
      success: true,
      message: `Successfully created coupon "${code}" for form ${slug_or_id}`,
      coupon: response.results.coupon,
    };
  },
});
