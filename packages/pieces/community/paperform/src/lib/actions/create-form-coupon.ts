import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommonProps } from '../common/props';
import { PaperformCreateCouponResponse } from '../common/types';

export const createFormCoupon = createAction({
  auth: paperformAuth,
  name: 'createFormCoupon',
  displayName: 'Create Form Coupon',
  description: 'Creates a new discount coupon to a specified form.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new discount coupon on a specified Paperform form, configured as either a fixed amount or a percentage discount (the discount type prop selects the mode and the matching amount/percentage is required). Use to add a promotional code to a form; each call creates a separate coupon, so it is not idempotent.', idempotent: false },
  props: {
    formId: paperformCommonProps.formId,
    code: Property.ShortText({
      displayName: 'Coupon Code',
      required: true,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled or not.',
      required: false,
      defaultValue: true,
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
      required: true,
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
      code,
      enabled,
      target,
      discountType,
      discountAmount,
      discountPercentage,
      expiresAt,
    } = propsValue;

    if (discountType === 'amount' && (!discountAmount || discountAmount < 0)) {
      throw new Error(
        'Discount amount is required and must be ≥ 0 when discount type is amount'
      );
    }

    if (
      discountType === 'percentage' &&
      (!discountPercentage ||
        discountPercentage < 0 ||
        discountPercentage > 100)
    ) {
      throw new Error(
        'Discount percentage is required and must be between 0 and 100 when discount type is percentage'
      );
    }

    const requestBody: any = {
      code,
      enabled: enabled ?? true,
    };

    if (target) {
      requestBody.target = target;
    }

    if (discountType === 'amount' && discountAmount) {
      requestBody.discountAmount = discountAmount;
    }

    if (discountType === 'percentage' && discountPercentage) {
      requestBody.discountPercentage = discountPercentage;
    }

    if (expiresAt) {
      requestBody.expiresAt = expiresAt;
    }

    try {
      const response =
        await paperformCommon.apiCall<PaperformCreateCouponResponse>({
          method: HttpMethod.POST,
          url: `/forms/${formId}/coupons`,
          body: requestBody,
          auth: auth.secret_text,
        });

      return response.results.coupon;
    } catch (error: any) {
      throw new Error(`Failed to create coupon: ${error.message}`);
    }
  },
});
