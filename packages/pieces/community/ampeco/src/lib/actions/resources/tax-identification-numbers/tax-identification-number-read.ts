import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TaxIdentificationNumberReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}
export const taxIdentificationNumberReadAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberRead',
  displayName: 'Resources - Tax Identification Numbers - Read',
  description: 'Get a Tax Identification Number.',
  props: {
        
  taxIdentificationNumber: Property.Number({
    displayName: 'Tax Identification Number',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TaxIdentificationNumberReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TaxIdentificationNumberReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
