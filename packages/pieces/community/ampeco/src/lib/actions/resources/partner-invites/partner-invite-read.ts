import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerInviteReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/partner-invites/v1.0/{partnerInvite}

export const partnerInviteReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInviteRead',
  displayName: 'Resources - Partner Invites - Read',
  description: 'Get a invite.',
  props: {
        
  partnerInvite: Property.Number({
    displayName: 'Partner Invite',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnerInviteReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-invites/v1.0/{partnerInvite}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerInviteReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
