import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListParkingSpaceResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/parking-spaces/v1.0

export const listParkingSpaceAction = createAction({
  auth: ampecoAuth,
  name: 'listParkingSpace',
  displayName: 'Resources - Parking Spaces - List',
  description: 'Get all Parking spaces.',
  props: {
        
  filter__externalId: Property.ShortText({
    displayName: 'Filter - External Id',
    description: '',
    required: false,
  }),

  filter__evseId: Property.Number({
    displayName: 'Filter - Evse Id',
    description: 'Only list Parking spaces on a certain EVSE',
    required: false,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'evses', value: 'evses' }
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
  async run(context): Promise<ListParkingSpaceResponse> {
    try {
      const url = processPathParameters('/public-api/resources/parking-spaces/v1.0', context.propsValue);
      
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
      }) as ListParkingSpaceResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListParkingSpaceResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
