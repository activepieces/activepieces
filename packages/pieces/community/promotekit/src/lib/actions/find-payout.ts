import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const findPayout = createAction({
  auth: promotekitAuth,
  name: 'find_payout',
  displayName: 'Find Payout',
  description: 'Get details of a specific payout by ID.',
  props: {
    payout_id: Property.ShortText({
      displayName: 'Payout ID',
      description: 'The ID of the payout to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/payouts/${context.propsValue.payout_id}`,
    });
    return promotekitCommon.flattenPayout(response.body.data);
  },
});
