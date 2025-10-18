import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Deal } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const findDealAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_deal',
  displayName: 'Find Deal',
  description: 'Look up a deal by ID or by filter (e.g. name, reference)',
  props: {
    dealId: Property.Number({
      displayName: 'Deal ID',
      description: 'Specific deal ID to retrieve',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.dealId) {
      const response = await makeZendeskSellRequest<{ data: Deal }>(
        context.auth,
        HttpMethod.GET,
        `/deals/${context.propsValue.dealId}`
      );

      return {
        success: true,
        deal: response.data,
        count: 1,
      };
    }
    const params = new URLSearchParams();
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await makeZendeskSellRequest<{ items: Deal[] }>(
      context.auth,
      HttpMethod.GET,
      `/deals${queryString}`
    );

    return {
      success: true,
      deals: response.items,
      count: response.items.length,
    };
  },
});
