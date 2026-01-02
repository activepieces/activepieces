import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UserGroupCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const userGroupCreateAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupCreate',
  displayName: 'Resources - User Groups - User Group Create',
  description: 'Create new user group. (Endpoint: POST /public-api/resources/user-groups/v1.0)',
  props: {
        
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
  async run(context): Promise<UserGroupCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/user-groups/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'partnerId', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as UserGroupCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
