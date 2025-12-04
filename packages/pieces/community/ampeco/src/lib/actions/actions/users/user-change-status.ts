import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const userChangeStatusAction = createAction({
  auth: ampecoAuth,
  name: 'userChangeStatus',
  displayName: 'Actions - Users - User Change Status',
  description: 'Set the status for a user. (Endpoint: POST /public-api/actions/users/v1.0/{user}/change-status)',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: `* \`enabled\` Enabled - the user is allowed to use the system\n* \`disabled\` Disabled - the user is NOT allowed to use the system\n`,
    required: true,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/change-status', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['status', 'reason']
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
