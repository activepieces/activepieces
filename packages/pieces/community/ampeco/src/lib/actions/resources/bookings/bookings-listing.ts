import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  paginate,
  prepareQueryParams,
  processPathParameters
} from '../../../common/utils';
import { BookingsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/bookings/v1.0
export const bookingsListingAction = createAction({
  auth: ampecoAuth,
  name: 'bookingsListing',
  displayName: 'Resources - Bookings - Listing',
  description: 'Get all bookings.',
  props: {
    filter__status: Property.StaticDropdown({
      displayName: 'Filter - Status',
      description: 'Filter by booking status',
      required: false,
      options: {
        options: [
          { label: 'accepted', value: 'accepted' },
          { label: 'reserved', value: 'reserved' },
          { label: 'completed', value: 'completed' },
          { label: 'cancelled', value: 'cancelled' },
          { label: 'no-show', value: 'no-show' },
          { label: 'failed', value: 'failed' },
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
      description: 'Filter bookings with start time after this date',
      required: false,
    }),

    filter__startBefore: Property.DateTime({
      displayName: 'Filter - Start Before',
      description: 'Filter bookings with start time before this date',
      required: false,
    }),

    filter__endAfter: Property.DateTime({
      displayName: 'Filter - End After',
      description: 'Filter bookings with end time after this date',
      required: false,
    }),

    filter__endBefore: Property.DateTime({
      displayName: 'Filter - End Before',
      description: 'Filter bookings with end time before this date',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per page',
      description:
        'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
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
  async run(context): Promise<BookingsListingResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/bookings/v1.0',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, [
        'filter',
        'per_page',
        'cursor',
      ]);

      const body = undefined;

      if (context.propsValue.usePagination) {
        return (await paginate({
          auth: context.auth,
          method: 'GET',
          path: url,
          queryParams,
          body,
          perPage: context.propsValue.per_page ?? 100,
          dataPath: 'data',
        })) as BookingsListingResponse;
      }

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      )) as BookingsListingResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
