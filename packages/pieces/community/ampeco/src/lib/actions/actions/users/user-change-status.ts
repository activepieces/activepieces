import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v1.0/{user}/change-status

export const userChangeStatusAction = createAction({
  auth: ampecoAuth,
  name: 'userChangeStatus',
  displayName: 'Actions - Users - Change Status',
  description: 'Set the status for a user.',
  audience: 'both',
  aiMetadata: { description: "Enable or disable a user account (enabled = allowed to use the system, disabled = blocked), recording the required reason. Idempotent: it sets the account to the chosen status, so re-running with the same status leaves the same end state.", idempotent: true },
  props: {
        
  user: Property.Number({
    displayName: 'User',
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
