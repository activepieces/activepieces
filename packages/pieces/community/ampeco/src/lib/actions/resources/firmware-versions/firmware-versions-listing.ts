import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { FirmwareVersionsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/firmware-versions/v1.0

export const firmwareVersionsListingAction = createAction({
  auth: ampecoAuth,
  name: 'firmwareVersionsListing',
  displayName: 'Resources - Firmware Versions - Listing',
  description: 'Get all Firmware Versions.',
  props: {
        
  filter__vendorId: Property.Array({
    displayName: 'Filter - Vendor Id',
    description: 'Filter by charge point vendor IDs.',
    required: false,
  }),

  filter__modelId: Property.Array({
    displayName: 'Filter - Model Id',
    description: 'Filter by charge point model IDs.',
    required: false,
  }),

  filter__firmwareVersion: Property.ShortText({
    displayName: 'Filter - Firmware Version',
    description: 'Filter by firmware version string. Matches both exact versions and versions that begin with the search string (e.g., "1.2" will match exactly "1.2" as well as versions like "1.2.0", "1.2.3", etc.).',
    required: false,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'models', value: 'models' }
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
  async run(context): Promise<FirmwareVersionsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/firmware-versions/v1.0', context.propsValue);
      
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
      }) as FirmwareVersionsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as FirmwareVersionsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
