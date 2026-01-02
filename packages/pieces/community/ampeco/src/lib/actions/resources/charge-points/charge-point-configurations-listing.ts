import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointConfigurationsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointConfigurationsListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointConfigurationsListing',
  displayName: 'Resources - Charge Points - Charge Point Configurations Listing',
  description: 'Get a charge point&#x27;s all cached configurations. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/configurations)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  filter__name: Property.ShortText({
    displayName: 'Filter - Name',
    description: 'Only list configuration keys identified by variable name',
    required: false,
  }),

  filter__instance: Property.ShortText({
    displayName: 'Filter - Instance',
    description: 'Only list configuration keys identified by instance',
    required: false,
  }),

  filter__componentName: Property.ShortText({
    displayName: 'Filter - Component Name',
    description: 'Only list configuration keys identified by component name',
    required: false,
  }),

  filter__evseId: Property.Number({
    displayName: 'Filter - Evse Id',
    description: 'Only list configuration keys identified by EVSE ID',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointConfigurationsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/configurations', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointConfigurationsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
