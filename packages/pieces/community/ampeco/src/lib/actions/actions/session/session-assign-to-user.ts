import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/session/v1.0/{session}/assign-user

export const sessionAssignToUserAction = createAction({
  auth: ampecoAuth,
  name: 'sessionAssignToUser',
  displayName: 'Actions - Session - Assign To User',
  description: 'Assign a user to a session. This action is only applicable to sessions with Completed billing status that have no user associated with them. This operation can be done only once and is not reversible.',
  props: {
        
  session: Property.Number({
    displayName: 'Session',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/session/v1.0/{session}/assign-user', context.propsValue);
      
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
