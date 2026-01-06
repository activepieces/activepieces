import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/partner-invites/v1.0/{partnerInvite}
export const partnerInviteDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInviteDelete',
  displayName: 'Resources - Partner Invites - Partner Invite Delete',
  description: 'Delete an invite.',
  props: {
        
  partnerInvite: Property.Number({
    displayName: 'Partner Invite',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/partner-invites/v1.0/{partnerInvite}', context.propsValue);
      
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
