import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointChangeSharingCodeAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointChangeSharingCode',
  displayName: 'Actions - Charge Point - Charge Point Change Sharing Code',
  description: 'Change sharing code for the Charge Point. (Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/change-sharing-code)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  sharingCode: Property.ShortText({
    displayName: 'Sharing Code',
    description: 'The sharing code which provides access to the personal charge point for other users aside from the owner. If left empty the current code will be deleted',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/change-sharing-code', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['sharingCode']
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
