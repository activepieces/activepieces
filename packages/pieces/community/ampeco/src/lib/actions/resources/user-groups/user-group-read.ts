import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { UserGroupReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: GET /public-api/resources/user-groups/v1.0/{userGroup}

export const userGroupReadAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupRead',
  displayName: 'Resources - User Groups - Read',
  description: 'Get an user group.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single AMPECO user group by its numeric ID. Read-only and idempotent; pick this when you already know the group ID. To search or enumerate groups instead, use the user groups listing action.', idempotent: true },
  props: {
        
  userGroup: Property.Number({
    displayName: 'User Group',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<UserGroupReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/user-groups/v1.0/{userGroup}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as UserGroupReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
