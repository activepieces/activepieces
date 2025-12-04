import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointChangeOwnerAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointChangeOwner',
  displayName: 'Actions - Charge Point - Charge Point Change Owner',
  description: 'Change the owner of the Charge Point. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/change-owner)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    description: 'This User would become the owner of the personal charge point. If left empty - no Owner would be assigned.',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/change-owner', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['userId']
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
