import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TaxIdentificationNumberUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}

export const taxIdentificationNumberUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberUpdate',
  displayName: 'Resources - Tax Identification Numbers - Update',
  description: 'Tax Identification Numbers.',
  audience: 'both',
  aiMetadata: { description: 'Update an existing tax identification number by its numeric ID, changing its name. Use when modifying a known TIN record rather than creating one; targets a specific record so re-running with the same values is safe.', idempotent: true },
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
