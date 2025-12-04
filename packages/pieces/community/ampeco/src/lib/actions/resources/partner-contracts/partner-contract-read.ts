import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerContractReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerContractReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerContractRead',
  displayName: 'Resources - Partner Contracts - Partner Contract Read',
  description: 'Get a Partner Contract. (Endpoint: GET /public-api/resources/partner-contracts/v1.0/{partnerContract})',
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
