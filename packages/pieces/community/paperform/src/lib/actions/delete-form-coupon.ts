import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { couponCodeDropdown, formSlugOrIdDropdown } from '../common/props';

export const deleteFormCoupon = createAction({
  auth: PaperformAuth,
  name: 'deleteFormCoupon',
  displayName: 'Delete Form Coupon',
  description: 'Delete a coupon from a specific form',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    coupon_code: couponCodeDropdown,
  },
  async run(context) {
    const { slug_or_id, coupon_code } = context.propsValue;
    const apiKey = context.auth as string;

    await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${slug_or_id}/coupons/${coupon_code}`
    );

    return {
      success: true,
      message: `Successfully deleted coupon ${coupon_code} from form ${slug_or_id}`,
      coupon_code: coupon_code,
      form_slug_or_id: slug_or_id,
    };
  },
});
