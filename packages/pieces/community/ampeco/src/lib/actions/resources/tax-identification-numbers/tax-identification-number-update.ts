import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TaxIdentificationNumberUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const taxIdentificationNumberUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberUpdate',
  displayName: 'Resources - Tax Identification Numbers - Tax Identification Number Update',
  description: 'Tax Identification Numbers. (Endpoint: PATCH /public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber})',
  props: {
        
  taxIdentificationNumber: Property.Number({
    displayName: 'Tax Identification Number',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<TaxIdentificationNumberUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as TaxIdentificationNumberUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
