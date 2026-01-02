import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UserGroupUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const userGroupUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupUpdate',
  displayName: 'Resources - User Groups - User Group Update',
  description: 'Update a user group. (Endpoint: PATCH /public-api/resources/user-groups/v1.0/{userGroup})',
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
