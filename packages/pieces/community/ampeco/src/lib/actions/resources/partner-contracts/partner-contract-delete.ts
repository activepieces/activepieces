import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const partnerContractDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'partnerContractDelete',
  displayName: 'Resources - Partner Contracts - Partner Contract Delete',
  description: 'Delete a Partner Contract. (Endpoint: DELETE /public-api/resources/partner-contracts/v1.0/{partnerContract})',
  props: {
        
  partnerContract: Property.Number({
    displayName: 'Partner Contract',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/partner-contracts/v1.0/{partnerContract}', context.propsValue);
      
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
