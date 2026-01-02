import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerInviteReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerInviteReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInviteRead',
  displayName: 'Resources - Partner Invites - Partner Invite Read',
  description: 'Get a invite. (Endpoint: GET /public-api/resources/partner-invites/v1.0/{partnerInvite})',
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
