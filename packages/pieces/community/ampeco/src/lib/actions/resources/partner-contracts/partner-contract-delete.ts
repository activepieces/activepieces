import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/partner-contracts/v1.0/{partnerContract}

export const partnerContractDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'partnerContractDelete',
  displayName: 'Resources - Partner Contracts - Delete',
  description: 'Delete a Partner Contract.',
  audience: 'both',
  aiMetadata: { description: 'Deletes one partner contract in AMPECO by its numeric ID. Use to remove a contract; requires the partner contract ID. Idempotent in effect: the end state is the contract being gone, though a repeat call may report it as already removed.', idempotent: true },
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
