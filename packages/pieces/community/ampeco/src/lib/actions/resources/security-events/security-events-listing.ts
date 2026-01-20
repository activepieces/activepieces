import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SecurityEventsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/security-events/v2.0

export const securityEventsListingAction = createAction({
  auth: ampecoAuth,
  name: 'securityEventsListing',
  displayName: 'Resources - Security Events - Security Events Listing',
  description: 'Get all Security Events.',
  props: {
        
  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    description: 'Type of critical security events that are pushed from the Charge Point to the backend.',
    required: false,
    options: {
      options: [
      { label: 'FirmwareUpdated', value: 'FirmwareUpdated' },
      { label: 'SettingSystemTime', value: 'SettingSystemTime' },
      { label: 'StartupOfTheDevice', value: 'StartupOfTheDevice' },
      { label: 'ResetOrReboot', value: 'ResetOrReboot' },
      { label: 'SecurityLogWasCleared', value: 'SecurityLogWasCleared' },
      { label: 'MemoryExhaustion', value: 'MemoryExhaustion' },
      { label: 'TamperDetectionActivated', value: 'TamperDetectionActivated' }
      ],
    },
  }),

  filter__chargePoint: Property.Number({
    displayName: 'Filter - Charge Point',
    description: '',
    required: false,
  }),

  filter__timestampFrom: Property.ShortText({
    displayName: 'Filter - Timestamp From',
    description: '',
    required: false,
  }),

  filter__timestampTo: Property.ShortText({
    displayName: 'Filter - Timestamp To',
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
  async run(context): Promise<SecurityEventsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/security-events/v2.0', context.propsValue);
      
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
      }) as SecurityEventsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SecurityEventsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
