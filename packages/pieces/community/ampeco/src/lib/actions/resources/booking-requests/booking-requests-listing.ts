import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { BookingRequestsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/booking-requests/v1.0
export const bookingRequestsListingAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRequestsListing',
  displayName: 'Resources - Booking Requests - Booking Requests Listing',
  description: 'Get all booking requests.',
  props: {
        
  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Filter by booking request status',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'approved', value: 'approved' },
      { label: 'rejected', value: 'rejected' }
      ],
    },
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Filter by user ID',
    required: false,
  }),

  filter__locationId: Property.Number({
    displayName: 'Filter - Location Id',
    description: 'Filter by location ID',
    required: false,
  }),

  filter__startAfter: Property.DateTime({
    displayName: 'Filter - Start After',
    description: 'Filter requests with start time after this date',
    required: false,
  }),

  filter__startBefore: Property.DateTime({
    displayName: 'Filter - Start Before',
    description: 'Filter requests with start time before this date',
    required: false,
  }),

  filter__endAfter: Property.DateTime({
    displayName: 'Filter - End After',
    description: 'Filter requests with end time after this date',
    required: false,
  }),

  filter__endBefore: Property.DateTime({
    displayName: 'Filter - End Before',
    description: 'Filter requests with end time before this date',
    required: false,
  }),

  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'Filter requests that were created after this date',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'Filter requests that were created before this date',
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
  async run(context): Promise<BookingRequestsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/booking-requests/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'per_page', 'cursor']);
      
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
      }) as BookingRequestsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as BookingRequestsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
