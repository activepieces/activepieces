import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointDowntimePeriodsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-point-downtime-periods/v1.0

export const chargePointDowntimePeriodsListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodsListing',
  displayName: 'Resources - Charge Point Downtime Periods - Listing',
  description: 'Get all Charge Point Downtime Periods.',
  props: {
        
  filter__chargePointId: Property.Number({
    displayName: 'Filter - Charge Point Id',
    required: false,
  }),

  filter__locationId: Property.Number({
    displayName: 'Filter - Location Id',
    required: false,
  }),

  filter__entryMode: Property.StaticDropdown({
    displayName: 'Filter - Entry Mode',
    required: false,
    options: {
      options: [
      { label: 'manual', value: 'manual' },
      { label: 'automatic', value: 'automatic' }
      ],
    },
  }),

  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    required: false,
    options: {
      options: [
      { label: 'downtime', value: 'downtime' },
      { label: 'exempt', value: 'exempt' }
      ],
    },
  }),

  filter__startedAfter: Property.DateTime({
    displayName: 'Filter - Started After',
    description: 'ISO 8601 formatted date. Resources with `startedAt >= startedAfter`.',
    required: false,
  }),

  filter__stoppedBefore: Property.DateTime({
    displayName: 'Filter - Stopped Before',
    description: 'ISO 8601 formatted date. Resources with `stoppedAt <= stoppedBefore`.',
    required: false,
  }),

  filter__durationLessThan: Property.Number({
    displayName: 'Filter - Duration Less Than',
    description: 'Resources with duration in minutes less than or equal given value.',
    required: false,
  }),

  filter__durationGreaterThan: Property.Number({
    displayName: 'Filter - Duration Greater Than',
    description: 'Resources with duration in minutes greater than or equal given value.',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and before this datetime',
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
  async run(context): Promise<ChargePointDowntimePeriodsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-downtime-periods/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'filter']);
      
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
      }) as ChargePointDowntimePeriodsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointDowntimePeriodsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
