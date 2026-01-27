import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ReservationsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/reservations/v1.0

export const reservationsListingAction = createAction({
  auth: ampecoAuth,
  name: 'reservationsListing',
  displayName: 'Resources - Reservations - Reservations Listing',
  description: 'Get all reservations.',
  props: {
        
  filter__evseId: Property.Number({
    displayName: 'Filter - Evse Id',
    description: 'Only list reservations for  specific EVSE by ID',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list reservations for a specific user by ID',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Only list reservations with this status',
    required: false,
    options: {
      options: [
      { label: 'active', value: 'active' },
      { label: 'expired', value: 'expired' },
      { label: 'canceled', value: 'canceled' },
      { label: 'done', value: 'done' }
      ],
    },
  }),

  filter__reservedFrom: Property.DateTime({
    displayName: 'Filter - Reserved From',
    description: 'Date from based on reserved at attribute',
    required: false,
  }),

  filter__reservedTo: Property.DateTime({
    displayName: 'Filter - Reserved To',
    description: 'Date to based on reserved at attribute',
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
  async run(context): Promise<ReservationsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/reservations/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page']);
      
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
      }) as ReservationsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ReservationsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
