import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps } from '../../common/props';
import { deleteCouponOutputSchema } from '../../output-schemas';

export const wooAiDeleteCoupon = createAction({
  name: 'delete_coupon',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Coupon',
  description: 'Move a coupon to the trash, or delete it permanently.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one coupon by id (find it with list_coupons by code) so it can no longer be used. By default it goes to the trash, which a person can restore from the WordPress admin; with permanent it is deleted for good. Trashing an already-trashed coupon fails, so a retry is not safe.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: deleteCouponOutputSchema,
  props: {
    coupon_id: Property.Number({
      displayName: 'Coupon ID',
      description: 'Id of the coupon to delete.',
      required: true,
    }),
    permanent: wooProps.permanentProp({ resource: 'coupon' }),
  },
  async run(context) {
    const { coupon_id, permanent } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/coupons/${wooClient.encodeId(coupon_id)}`,
      queryParams: { force: permanent === true },
    });
  },
});
