import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PaymentMethodsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/users/v1.0/{user}/payment-methods
export const paymentMethodsListingAction = createAction({
  auth: ampecoAuth,
  name: 'paymentMethodsListing',
  displayName: 'Resources - Users - Payment Methods Listing',
  description: 'Get all payment methods for a user.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
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
  async run(context): Promise<PaymentMethodsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/payment-methods', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page']);
      
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
      }) as PaymentMethodsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PaymentMethodsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
