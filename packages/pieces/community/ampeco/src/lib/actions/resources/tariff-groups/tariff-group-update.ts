import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TariffGroupUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/tariff-groups/v1.0/{tariffGroup}
export const tariffGroupUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'tariffGroupUpdate',
  displayName: 'Resources - Tariff Groups - Update',
  description: 'Update a tariff group.',
  props: {
        
  tariffGroup: Property.Number({
    displayName: 'Tariff Group',
    description: '',
    required: true,
  }),

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
  async run(context): Promise<TariffGroupUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariff-groups/v1.0/{tariffGroup}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'tariffIds', 'partnerId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as TariffGroupUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
