import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const findCommission = createAction({
  auth: promotekitAuth,
  name: 'find_commission',
  displayName: 'Find Commission',
  description: 'Get details of a specific commission by ID.',
  props: {
    commission_id: Property.ShortText({
      displayName: 'Commission ID',
      description: 'The ID of the commission to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: `/commissions/${context.propsValue.commission_id}`,
    });
    return promotekitCommon.flattenCommission(response.body.data);
  },
});
