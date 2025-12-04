import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TaxIdentificationNumberCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const taxIdentificationNumberCreateAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberCreate',
  displayName: 'Resources - Tax Identification Numbers - Tax Identification Number Create',
  description: 'Create new Tax Identification Number. (Endpoint: POST /public-api/resources/tax-identification-numbers/v2.0)',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TaxIdentificationNumberCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tax-identification-numbers/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as TaxIdentificationNumberCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
