import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UserGroupUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: PATCH /public-api/resources/user-groups/v1.0/{userGroup}
export const userGroupUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupUpdate',
  displayName: 'Resources - User Groups - Update',
  description: 'Update a user group.',
  props: {
        
  userGroup: Property.Number({
    displayName: 'User Group',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: 'The partnerId can be updated only if there are no users added to the user group',
    required: false,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<UserGroupUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/user-groups/v1.0/{userGroup}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'partnerId', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UserGroupUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
