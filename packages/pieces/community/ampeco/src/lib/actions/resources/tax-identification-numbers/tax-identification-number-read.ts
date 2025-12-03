import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TaxIdentificationNumberReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const taxIdentificationNumberReadAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberRead',
  displayName: 'Resources - Tax Identification Numbers - Tax Identification Number Read',
  description: 'Get a Tax Identification Number. (Endpoint: GET /public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber})',
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
