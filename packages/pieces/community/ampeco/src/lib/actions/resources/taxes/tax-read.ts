import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TaxReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/taxes/v2.0/{tax}
export const taxReadAction = createAction({
  auth: ampecoAuth,
  name: 'taxRead',
  displayName: 'Resources - Taxes - Read',
  description: 'Get a Tax.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single tax rate by its numeric ID. Read-only and idempotent. Pick this when you already know the tax ID; otherwise use the taxes listing action to find it first.', idempotent: true },
  props: {
        
  tax: Property.Number({
    displayName: 'Tax',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TaxReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/taxes/v2.0/{tax}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TaxReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
