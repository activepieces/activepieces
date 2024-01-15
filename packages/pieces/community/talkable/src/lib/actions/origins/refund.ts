import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { talkableAuth } from '../../..';

export const refund = createAction({
  name: 'refund', // Must be a unique across the piece, this shouldn't be changed.
  auth: talkableAuth,
  displayName: 'Refund purchase/event',
  description: 'Mark origin as refund',
  props: {
    origin_slug: Property.ShortText({
      displayName: 'Order or event number',
      description: undefined,
      required: true,
    }),
    refund_subtotal: Property.Number({
      displayName: 'Refund subtotal',
      description: undefined,
      required: false,
    }),
    refunded_at: Property.DateTime({
      displayName: 'Refunded date',
      description: undefined,
      required: false,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error On Failure',
      required: false,
    }),
  },
  async run(context) {
    const TALKABLE_API_URL = 'https://www.talkable.com/api/v2';
    const { site, api_key } = context.auth;
    const { origin_slug, refund_subtotal, refunded_at } = context.propsValue;
    const refundResponse = await httpClient
      .sendRequest<string[]>({
        method: HttpMethod.POST,
        url: `${TALKABLE_API_URL}/origins/${origin_slug}/refund`,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: {
          site_slug: site,
          data: {
            refunded_at,
            refund_subtotal,
          },
        },
      })
      .catch((error) => {
        if (context.propsValue.failsafe) {
          return error.errorMessage();
        }
        throw error;
      });
    return refundResponse.body;
  },
});
