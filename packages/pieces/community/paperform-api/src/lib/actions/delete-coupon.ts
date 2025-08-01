import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const deleteCouponAction = createAction({
  displayName: 'Delete Form Coupon',
  name: 'delete_coupon',
  description: 'Remove a coupon from a form',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'The coupon code to delete',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/forms/${propsValue.formSlugOrId}/coupons/${propsValue.code}`;
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.DELETE
    );
    
    return {
      success: true,
      message: 'Coupon deleted successfully',
      formSlugOrId: propsValue.formSlugOrId,
      code: propsValue.code,
    };
  },
}); 