import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createFormCoupon = createAction({
  auth: paperformAuth,
  name: 'createFormCoupon',
  displayName: 'Create Form Coupon',
  description: 'Generate or attach a discount coupon to a specified form.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to create a coupon for',
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
    code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'The coupon code (required)',
      required: true,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the coupon is enabled or not',
      required: false,
      defaultValue: true,
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
      required: true,
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
      code, 
      enabled, 
      target, 
      discountType, 
      discountAmount, 
      discountPercentage, 
      expiresAt 
    } = propsValue;
    
    if (discountType === 'amount' && (!discountAmount || discountAmount < 0)) {
      throw new Error('Discount amount is required and must be ≥ 0 when discount type is amount');
    }
    
    if (discountType === 'percentage' && (!discountPercentage || discountPercentage < 0 || discountPercentage > 100)) {
      throw new Error('Discount percentage is required and must be between 0 and 100 when discount type is percentage');
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
      const response = await paperformCommon.apiCall({
        method: HttpMethod.POST,
        url: `/forms/${formId}/coupons`,
        body: requestBody,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Coupon "${code}" has been successfully created.`,
        coupon: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to create coupon: ${error.message}`);
    }
  },
});
