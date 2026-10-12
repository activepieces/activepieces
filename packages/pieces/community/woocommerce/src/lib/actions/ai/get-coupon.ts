import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { findCouponOutputSchema } from '../../output-schemas';
import { wooFindCoupon } from '../find-coupon';

export const wooAiGetCoupon = createAction({
  name: 'get_coupon',
  classification: 'READ',
  displayName: 'Get Coupon',
  description: 'Get a coupon by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one coupon by its numeric id with its code, discount, limits, restrictions and usage count. To find a coupon by its code use list_coupons. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findCouponOutputSchema,
  props: wooFindCoupon.props,
  run: wooFindCoupon.run,
});
