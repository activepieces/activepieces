import { createAction } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommonProps } from '../common/props';

export const deleteFormCoupon = createAction({
  auth: paperformAuth,
  name: 'deleteFormCoupon',
  displayName: 'Delete Form Coupon',
  description: 'Deletes a coupon from a form.',
  props: {
    formId: paperformCommonProps.formId,
    couponCode:paperformCommonProps.couponCode,
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
