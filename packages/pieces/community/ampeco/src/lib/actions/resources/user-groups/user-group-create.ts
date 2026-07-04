import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UserGroupCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/user-groups/v1.0
export const userGroupCreateAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupCreate',
  displayName: 'Resources - User Groups - Create',
  description: 'Create new user group.',
  audience: 'both',
  aiMetadata: { description: 'Create a new AMPECO user group with a name and optional description and partner association. Not idempotent: each call adds another group, so re-running creates duplicates. Note that partnerId can only be set while the group has no users; use the update action to modify an existing group.', idempotent: false },
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
