import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { UserReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/users/v1.0/{user}

export const userReadAction = createAction({
  auth: ampecoAuth,
  name: 'userRead',
  displayName: 'Resources - Users - User Read',
  description: 'Get a user.',
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

  withAmountDue: Property.StaticDropdown({
    displayName: 'With Amount Due',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<UserReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include', 'withAmountDue']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as UserReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
