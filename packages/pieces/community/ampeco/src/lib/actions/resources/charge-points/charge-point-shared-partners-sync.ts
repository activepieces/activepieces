import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointSharedPartnersSyncAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSharedPartnersSync',
  displayName: 'Resources - Charge Points - Charge Point Shared Partners Sync',
  description: 'Set the Shared Partners of the Charge Point. Attach Shared Partners within the Charge Point. The charge point must have an owner associated and its &#x60;access_type&#x60; must be &#x60;private&#x60;. (Endpoint: PUT /public-api/resources/charge-points/v2.0/{chargePoint}/shared-partners)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  partnerIds: Property.Array({
    displayName: 'Partner Ids',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/shared-partners', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['partnerIds']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
