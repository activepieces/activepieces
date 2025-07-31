import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformCoupon } from '../common/types';

export const updateFormCoupon = createAction({
  auth: paperformAuth,
  name: 'updateFormCoupon',
  displayName: 'Update Form Coupon',
  description: 'Modify an existing coupon\'s properties (discount amount, expiry, usage limits).',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to update a coupon for',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        
        try {
          const forms = await paperformCommon.getForms({
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: forms.results.forms.map((form) => ({
              label: form.title,
              value: form.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading forms',
            options: [],
          };
        }
      },
    }),
    couponCode: Property.Dropdown({
      displayName: 'Coupon',
      description: 'Select the coupon to update',
      required: true,
      refreshers: ['auth', 'formId'],
      options: async ({ auth, formId }) => {
        if (!auth || !formId) {
          return {
            disabled: true,
            placeholder: 'Please select a form first',
            options: [],
          };
        }
        
        try {
          const coupons = await paperformCommon.getCoupons({
            formSlugOrId: formId as string,
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: coupons.results.coupons.map((coupon: PaperformCoupon) => ({
              label: `${coupon.code} - ${coupon.enabled ? 'Enabled' : 'Disabled'}`,
              value: coupon.code,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading coupons',
            options: [],
          };
        }
      },
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled or not',
      required: false,
    }),
    target: Property.Dropdown({
      displayName: 'Target',
      description: 'The target of the coupon',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Price', value: 'price' },
            { label: 'Subscription', value: 'subscription' },
          ],
        };
      },
    }),
    discountType: Property.Dropdown({
      displayName: 'Discount Type',
      description: 'Choose between amount or percentage discount',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Amount', value: 'amount' },
            { label: 'Percentage', value: 'percentage' },
          ],
        };
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
  async run({ auth, propsValue }) {
    const { 
      formId, 
      couponCode, 
      enabled, 
      target, 
      discountType, 
      discountAmount, 
      discountPercentage, 
      expiresAt 
    } = propsValue;
    
    if (discountType === 'amount' && discountAmount !== undefined && discountAmount < 0) {
      throw new Error('Discount amount must be ≥ 0 when discount type is amount');
    }
    
    if (discountType === 'percentage' && discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
      throw new Error('Discount percentage must be between 0 and 100 when discount type is percentage');
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
      const response = await paperformCommon.apiCall({
        method: HttpMethod.PUT,
        url: `/forms/${formId}/coupons/${couponCode}`,
        body: requestBody,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Coupon "${couponCode}" has been successfully updated.`,
        coupon: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to update coupon: ${error.message}`);
    }
  },
});
