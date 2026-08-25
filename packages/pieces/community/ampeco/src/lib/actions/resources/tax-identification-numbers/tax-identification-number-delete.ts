import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}

export const taxIdentificationNumberDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'taxIdentificationNumberDelete',
  displayName: 'Resources - Tax Identification Numbers - Delete',
  description: 'Delete a Tax Identification Number.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a tax identification number by its numeric ID. Use when removing a TIN record; this is destructive and cannot be undone, so confirm the ID first. Re-running after the record is gone will error.', idempotent: false },
  props: {
        
  taxIdentificationNumber: Property.Number({
    displayName: 'Tax Identification Number',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/tax-identification-numbers/v2.0/{taxIdentificationNumber}', context.propsValue);
      
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
