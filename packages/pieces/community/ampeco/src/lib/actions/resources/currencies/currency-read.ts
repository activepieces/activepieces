import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CurrencyReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: GET /public-api/resources/currencies/v2.0/{currency}

export const currencyReadAction = createAction({
  auth: ampecoAuth,
  name: 'currencyRead',
  displayName: 'Resources - Currencies - Read',
  description: 'Currency / Read.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single currency from AMPECO by its numeric currency id, returning its code and display/precision configuration. Read-only and idempotent. Use when you already know the id; there is no list-currencies counterpart here.', idempotent: true },
  props: {
        
  currency: Property.Number({
    displayName: 'Currency',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CurrencyReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currencies/v2.0/{currency}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CurrencyReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
