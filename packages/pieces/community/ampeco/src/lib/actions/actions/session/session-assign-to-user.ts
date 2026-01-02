import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const sessionAssignToUserAction = createAction({
  auth: ampecoAuth,
  name: 'sessionAssignToUser',
  displayName: 'Actions - Session - Session Assign To User',
  description: 'Assign a user to a session. This action is only applicable to sessions with Completed billing status that have no user associated with them. This operation can be done only once and is not reversible. (Endpoint: POST /public-api/actions/session/v1.0/{session}/assign-user)',
  props: {
        
  session: Property.Number({
    displayName: 'Session',
    description: '',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    description: '',
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
