import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetPaymentTerminalsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/payment-terminals/v1.0

export const getPaymentTerminalsAction = createAction({
  auth: ampecoAuth,
  name: 'getPaymentTerminals',
  displayName: 'Resources - Payment Terminals - Get Payment Terminals',
  description: 'Get all payment terminals.',
  props: {
        
  filter__serialNumber: Property.ShortText({
    displayName: 'Filter - Serial Number',
    description: '',
    required: false,
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<GetPaymentTerminalsResponse> {
    try {
      const url = processPathParameters('/public-api/resources/payment-terminals/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page', 'filter']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as GetPaymentTerminalsResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetPaymentTerminalsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
