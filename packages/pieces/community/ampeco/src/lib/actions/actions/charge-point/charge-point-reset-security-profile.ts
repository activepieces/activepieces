import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointResetSecurityProfileAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointResetSecurityProfile',
  displayName: 'Actions - Charge Point - Charge Point Reset Security Profile',
  description: 'Reset the current security profile of the charge point in the backend. The next time the charge point connects, the backend will accept the connection and update the current security profile with the one that the charge point actually used to establish the connection. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/reset-security-profile)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/reset-security-profile', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
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
