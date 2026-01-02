import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointEvseConnectorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointEvseConnectorReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseConnectorRead',
  displayName: 'Resources - Charge Points - Charge Point Evse Connector Read',
  description: 'Get a charge point evse&#x27;s connector. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors/{connector})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),

  connector: Property.Number({
    displayName: 'Connector',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointEvseConnectorReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors/{connector}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointEvseConnectorReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
