import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  processPathParameters,
} from '../../../common/utils';
import { ChargePointConfigurationsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/configurations

export const chargePointConfigurationsListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointConfigurationsListing',
  displayName:
    'Resources - Charge Points - Charge Point Configurations Listing',
  description: "Get a charge point's all cached configurations.",
  props: {
    chargePoint: Property.Number({
      displayName: 'Charge Point',
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
      const url = processPathParameters(
        '/public-api/resources/charge-points/v2.0/{chargePoint}/configurations',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, ['filter']);

      const body = undefined;

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      )) as ChargePointConfigurationsListingResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
