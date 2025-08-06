import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformCreateCouponResponse } from '../common/types';
import { paperformCommonProps } from '../common/props';

export const updateFormCoupon = createAction({
  auth: paperformAuth,
  name: 'updateFormCoupon',
  displayName: 'Update Form Coupon',
  description:'Updates an existing form coupon.',
  props: {
    formId: paperformCommonProps.formId,
    couponCode: paperformCommonProps.couponCode,
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled or not',
      required: false,
    }),
    target: Property.StaticDropdown({
      displayName: 'Target',
      description: 'The target of the coupon.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Price', value: 'price' },
          { label: 'Subscription', value: 'subscription' },
        ],
      },
    }),
    discountType: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'Choose between amount or percentage discount.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Amount', value: 'amount' },
          { label: 'Percentage', value: 'percentage' },
        ],
      },
    }),
    discountAmount: Property.Number({
      displayName: 'Discount Amount',
      required: false,
    }),
    discountPercentage: Property.Number({
      displayName: 'Discount Percentage',
      required: false,
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'The date and time when the coupon expires.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      formId,
      couponCode,
      enabled,
      target,
      discountType,
      discountAmount,
      discountPercentage,
      expiresAt,
    } = propsValue;

    if (
      discountType === 'amount' &&
      discountAmount !== undefined &&
      discountAmount < 0
    ) {
      throw new Error(
        'Discount amount must be ≥ 0 when discount type is amount'
      );
    }

    if (
      discountType === 'percentage' &&
      discountPercentage !== undefined &&
      (discountPercentage < 0 || discountPercentage > 100)
    ) {
      throw new Error(
        'Discount percentage must be between 0 and 100 when discount type is percentage'
      );
    }

    const requestBody: any = {};

    if (enabled !== undefined) {
      requestBody.enabled = enabled;
    }

    if (target) {
      requestBody.target = target;
    }

    if (discountType === 'amount' && discountAmount !== undefined) {
      requestBody.discountAmount = discountAmount;
    }

    if (discountType === 'percentage' && discountPercentage !== undefined) {
      requestBody.discountPercentage = discountPercentage;
    }

    if (expiresAt) {
      requestBody.expiresAt = expiresAt;
    }

    try {
      const response =
        await paperformCommon.apiCall<PaperformCreateCouponResponse>({
          method: HttpMethod.PUT,
          url: `/forms/${formId}/coupons/${couponCode}`,
          body: requestBody,
          auth: auth as string,
        });

      return response.results.coupon;
    } catch (error: any) {
      throw new Error(`Failed to update coupon: ${error.message}`);
    }
  },
});
