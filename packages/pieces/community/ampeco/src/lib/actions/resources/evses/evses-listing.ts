import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { EvsesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/evses/v2.1

export const evsesListingAction = createAction({
  auth: ampecoAuth,
  name: 'evsesListing',
  displayName: 'Resources - Evses - Listing',
  description: 'Get all EVSEs.',
  props: {
        
  filter__chargePointId: Property.Number({
    displayName: 'Filter - Charge Point Id',
    description: 'Only list EVSEs on a certain charge point',
    required: false,
  }),

  filter__physicalReference: Property.ShortText({
    displayName: 'Filter - Physical Reference',
    description: 'Only list EVSEs, identified by id (QR Code)',
    required: false,
  }),

  filter__externalId: Property.ShortText({
    displayName: 'Filter - External Id',
    description: 'Only list EVSEs, identified by externalId',
    required: false,
  }),

  filter__roaming: Property.StaticDropdown({
    displayName: 'Filter - Roaming',
    description: 'If true, only roaming EVSEs will be returned. If false, only local EVSEs will be returned. If not passing, all EVSEs will be returned.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
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

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'connectors', value: 'connectors' },
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
  async run(context): Promise<EvsesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evses/v2.1', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'include', 'per_page', 'cursor']);
      
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
      }) as EvsesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as EvsesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
