import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CdrsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/cdrs/v2.0

export const cdrsListingAction = createAction({
  auth: ampecoAuth,
  name: 'cdrsListing',
  displayName: 'Resources - Cdrs - Listing',
  description: 'Get all CDRs.',
  props: {
        
  filter__startDateTimeFrom: Property.DateTime({
    displayName: 'Filter - Start Date Time From',
    description: 'Filters CDRs by the start time, selecting records with a start time equal to or later than the specified value. The date-time should be formatted according to ISO 8601 standards.',
    required: false,
  }),

  filter__startDateTimeTo: Property.DateTime({
    displayName: 'Filter - Start Date Time To',
    description: 'Filters CDRs by the start time, selecting records with a start time equal to or earlier than the specified value. This filter helps in selecting records up to a certain start time. The provided date-time should be in ISO 8601 format.',
    required: false,
  }),

  filter__endDateTimeFrom: Property.DateTime({
    displayName: 'Filter - End Date Time From',
    description: 'This filter retrieves CDRs with an end time equal to or later than the specified value. It helps filter records based on the end of a timeframe, ensuring that only records ending after a certain point are selected. The date-time format should adhere to ISO 8601 standards.',
    required: false,
  }),

  filter__endDateTimeTo: Property.DateTime({
    displayName: 'Filter - End Date Time To',
    description: 'Filters CDRs based on their end time, selecting those with an end time equal to or earlier than the provided value. This filter limits the selection to records that conclude by a certain time. The date-time should be in ISO 8601 format.',
    required: false,
  }),

  filter__operatorId: Property.Number({
    displayName: 'Filter - Operator Id',
    description: 'Only CDRs associated with a specific Roaming Operator/Provider.',
    required: false,
  }),

  filter__platformId: Property.Number({
    displayName: 'Filter - Platform Id',
    description: 'Only CDRs linked to a specific Roaming Platform.',
    required: false,
  }),

  filter__roamingId: Property.ShortText({
    displayName: 'Filter - Roaming Id',
    description: 'Filters CDRs by the unique identifier within the CPO’s platform (and sub-operator platforms). If you use this filter, it will return a single result.',
    required: false,
  }),

  filter__credit: Property.ShortText({
    displayName: 'Filter - Credit',
    description: 'Only Credit CDRs.',
    required: false,
  }),

  filter__isLocal: Property.ShortText({
    displayName: 'Filter - Is Local',
    description: 'If true only CDRs that we issued as CPO will be returned, if false only CDRs that we received as eMSP will be returned.',
    required: false,
  }),

  filter__receivedAfter: Property.DateTime({
    displayName: 'Filter - Received After',
    description: 'Filters CDRs by the time when received from CPOs, selecting records with a received time equal to or later than the specified value. This filter helps in selecting received records from a certain time and works for non local CDRs. The provided date-time should be following the ISO 8601 standard.',
    required: false,
  }),

  filter__receivedBefore: Property.DateTime({
    displayName: 'Filter - Received Before',
    description: 'Filters CDRs by the time when received from CPOs, selecting records with a start time equal to or earlier than the specified value. This filter helps in selecting received records up to a certain time and works for non local CDRs. The provided date-time should be following the ISO 8601 standard.',
    required: false,
  }),

  filter__sentAfter: Property.DateTime({
    displayName: 'Filter - Sent After',
    description: 'Filters CDRs by the time when sent to EMSP, selecting records with a sent time equal to or later than the specified value. This filter helps in selecting sent records from a certain time and works for local CDRs. The provided date-time should be following the ISO 8601 standard.',
    required: false,
  }),

  filter__sentBefore: Property.DateTime({
    displayName: 'Filter - Sent Before',
    description: 'Filters CDRs by the time when sent to EMSP, selecting records with a sent time equal to or earlier than the specified value. This filter helps in selecting sent records from a certain time and works for local CDRs. The provided date-time should be following the ISO 8601 standard.',
    required: false,
  }),

  filter__deliveryResponse: Property.StaticDropdown({
    displayName: 'Filter - Delivery Response',
    description: `Filters CDRs that were sent to the EMSP based on their delivery status.\nUse this dropdown filter to retrieve CDRs with one of the following statuses:\n  - \`success\`: CDRs successfully **accepted** by the EMSP.\n  - \`fail\`: CDRs that were **rejected** (not accepted) by the EMSP.\n`,
    required: false,
    options: {
      options: [
      { label: 'success', value: 'success' },
      { label: 'fail', value: 'fail' }
      ],
    },
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
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
  async run(context): Promise<CdrsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/cdrs/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'cursor', 'filter', 'include']);
      
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
      }) as CdrsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CdrsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
