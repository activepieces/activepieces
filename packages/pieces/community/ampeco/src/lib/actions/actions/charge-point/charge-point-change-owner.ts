import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/change-owner
export const chargePointChangeOwnerAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointChangeOwner',
  displayName: 'Actions - Charge Point - Change Owner',
  description: 'Change the owner of the Charge Point.',
  audience: 'both',
  aiMetadata: { description: 'Reassign ownership of a personal charge point to the given user, or remove the owner when no user id is supplied. Use for transferring a home/personal charger between accounts. Setting the same owner twice yields the same end state, so it is effectively idempotent for a fixed user id.', idempotent: true },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User ID',
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
