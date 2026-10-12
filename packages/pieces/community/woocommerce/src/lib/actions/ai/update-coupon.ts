import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { updateCouponOutputSchema } from '../../output-schemas';
import { wooUpdateCoupon } from '../update-coupon';

export const wooAiUpdateCoupon = createAction({
  name: 'update_coupon',
  classification: 'WRITE',
  displayName: 'Update Coupon',
  description: 'Change the amount, type, expiry or limits of a coupon.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the amount, discount type, description, expiry date, usage limit or minimum spend of one coupon by id; fields left empty are kept. Find the id with list_coupons by code.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCouponOutputSchema,
  props: wooUpdateCoupon.props,
  run: wooUpdateCoupon.run,
});
