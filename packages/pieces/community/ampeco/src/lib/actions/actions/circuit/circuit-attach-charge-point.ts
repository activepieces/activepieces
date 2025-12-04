import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const circuitAttachChargePointAction = createAction({
  auth: ampecoAuth,
  name: 'circuitAttachChargePoint',
  displayName: 'Actions - Circuit - Circuit Attach Charge Point',
  description: 'To maintain safety and compatibility, only charge points with an identical electrical configuration to the circuit can be added. (Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/attach-charge-point)',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),

  chargePointId: Property.Number({
    displayName: 'Charge Point Id',
    description: '',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/attach-charge-point', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['chargePointId', 'priority']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
