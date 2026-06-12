import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const findCoupon = createAction({
  name: 'find_coupon', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Find coupon',
  description: 'Find coupon code',
  audience: 'both',
  aiMetadata: { description: 'Look up a Talkable coupon by its code and return its details. Use to verify a coupon exists or inspect its status/value. Read-only; the coupon code is required.', idempotent: true },
  props: {
    code: Property.ShortText({
      displayName: 'Coupon code',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth.props;
    const couponInfoResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${TALKABLE_API_URL}/coupons/${context.propsValue['code']}`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
        },
      });
    return couponInfoResponse.body;
  },
});
