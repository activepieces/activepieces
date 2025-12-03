import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const userGroupDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupDelete',
  displayName: 'Resources - User Groups - User Group Delete',
  description: 'Delete a user group. (Endpoint: DELETE /public-api/resources/user-groups/v1.0/{userGroup})',
  props: {
        
  userGroup: Property.Number({
    displayName: 'User Group',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/user-groups/v1.0/{userGroup}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
