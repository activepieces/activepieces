import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformCoupon } from '../common/types';

export const deleteFormCoupon = createAction({
  auth: paperformAuth,
  name: 'deleteFormCoupon',
  displayName: 'Delete Form Coupon',
  description: 'Remove a coupon from a form.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to delete a coupon from',
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
      description: 'Select the coupon to delete',
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
  },
  async run({ auth, propsValue }) {
    const { formId, couponCode } = propsValue;
    
    try {
      await paperformCommon.apiCall({
        method: HttpMethod.DELETE,
        url: `/forms/${formId}/coupons/${couponCode}`,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Coupon "${couponCode}" has been successfully deleted.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete coupon: ${error.message}`);
    }
  },
});
