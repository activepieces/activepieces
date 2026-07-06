import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/users/v1.0/{user}

export const userDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'userDelete',
  displayName: 'Resources - Users - User Delete',
  description: 'Delete a user.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a single AMPECO user by numeric user id. Destructive and irreversible; confirm the id (e.g. via User Read or Users Listing) before calling. Not a safe retry against an arbitrary id.', idempotent: false },
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'partnerInvites', value: 'partnerInvites' },
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
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
