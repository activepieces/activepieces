import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const updateCouponAction = createAction({
  displayName: 'Update Form Coupon',
  name: 'update_coupon',
  description: 'Modify an existing coupon\'s properties (discount amount, expiry, usage limits)',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'The coupon code to update',
      required: true,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled or not',
      required: false,
    }),
    target: Property.StaticDropdown({
      displayName: 'Target',
      description: 'The target of the coupon',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Price', value: 'price' },
        ],
      },
    }),
    discountAmount: Property.Number({
      displayName: 'Discount Amount',
      description: 'The discount as an amount (≥ 0)',
      required: false,
    }),
    discountPercentage: Property.Number({
      displayName: 'Discount Percentage',
      description: 'The discount as a percentage (0 to 100)',
      required: false,
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'The date and time when the coupon expires',
      required: false,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/forms/${propsValue.formSlugOrId}/coupons/${propsValue.code}`;
    
    // Build request body with only provided values
    const body: any = {};
    
    if (propsValue.enabled !== undefined) {
      body.enabled = propsValue.enabled;
    }
    
    if (propsValue.target) {
      body.target = propsValue.target;
    }
    
    if (propsValue.discountAmount !== undefined) {
      body.discountAmount = propsValue.discountAmount;
    }
    
    if (propsValue.discountPercentage !== undefined) {
      body.discountPercentage = propsValue.discountPercentage;
    }
    
    if (propsValue.expiresAt) {
      body.expiresAt = propsValue.expiresAt;
    }
    
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.PUT,
      body
    );
    
    return {
      success: true,
      message: 'Coupon updated successfully',
      coupon: response.body,
      formSlugOrId: propsValue.formSlugOrId,
      code: propsValue.code,
    };
  },
}); 