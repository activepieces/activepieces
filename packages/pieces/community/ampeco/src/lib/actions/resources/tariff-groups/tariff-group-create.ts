import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TariffGroupCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/tariff-groups/v1.0

export const tariffGroupCreateAction = createAction({
  auth: ampecoAuth,
  name: 'tariffGroupCreate',
  displayName: 'Resources - Tariff Groups - Create',
  description: 'Create new tariff group. Please note that createing a new tariff group will also automatically create a free base tariff, as it is not allowed to have empty tariff groups.',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),

  tariffIds: Property.Array({
    displayName: 'Tariff Ids',
    description: 'Ordered list of tariff ids in the group. Please note that the order is checked from bottom to top, meaning that the tariff with the largest index in that list (in other words that is the lowest in the list), that matches the requirements will apply',
    required: false,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: 'The assigned Partner will have access to make changes to the tariff group.',
    required: false,
  }),
  },
  async run(context): Promise<TariffGroupCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariff-groups/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'tariffIds', 'partnerId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as TariffGroupCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
