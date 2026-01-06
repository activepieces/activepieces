import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerContractReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/partner-contracts/v1.0/{partnerContract}

export const partnerContractReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerContractRead',
  displayName: 'Resources - Partner Contracts - Read',
  description: 'Get a Partner Contract.',
  props: {
        
  partnerContract: Property.Number({
    displayName: 'Partner Contract',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnerContractReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-contracts/v1.0/{partnerContract}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerContractReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
