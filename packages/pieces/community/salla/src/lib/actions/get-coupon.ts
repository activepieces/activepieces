import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const getCouponAction = createAction({
  auth: sallaAuth,
  name: 'get_coupon',
  classification: 'READ',
  displayName: 'Get Coupon',
  description: 'Gets one coupon by ID, with how many times it was used if you want that. The Salla app needs the Marketing scope.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Salla coupon by numeric coupon ID (for example 1622617640, not the code customers type), with its discount, dates, limits and rules, plus times used, customers and sales when Include Usage Statistics is on. Use Find Coupons or List Coupons to look a coupon up by its code first. Read-only and safe to retry; needs the Marketing scope.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.coupon,
  props: {
    coupon: sallaProps.coupon({ required: true }),
    include_stats: Property.Checkbox({
      displayName: 'Include Usage Statistics',
      description: 'Also return how many times the coupon was used, by how many customers, and the sales made with it (paid orders only). Costs one extra request.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.getCoupon({
      auth,
      couponId: propsValue.coupon,
      includeStats: propsValue.include_stats === true,
    });
  },
});
