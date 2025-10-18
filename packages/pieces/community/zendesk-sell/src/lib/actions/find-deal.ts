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
    name: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Search by deal name',
      required: false,
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'Filter by associated contact',
      required: false,
    }),
    stageId: Property.Number({
      displayName: 'Stage ID',
      description: 'Filter by pipeline stage',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'Filter by deal owner',
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
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.contactId) params.append('contact_id', context.propsValue.contactId.toString());
    if (context.propsValue.stageId) params.append('stage_id', context.propsValue.stageId.toString());
    if (context.propsValue.ownerId) params.append('owner_id', context.propsValue.ownerId.toString());

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
