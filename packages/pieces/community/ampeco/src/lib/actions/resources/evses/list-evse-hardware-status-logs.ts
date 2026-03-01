import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListEvseHardwareStatusLogsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/evses/v2.0/{evse}/hardware-status-logs

export const listEvseHardwareStatusLogsAction = createAction({
  auth: ampecoAuth,
  name: 'listEvseHardwareStatusLogs',
  displayName: 'Resources - Evses - List Evse Hardware Status Logs',
  description: 'Get paginated list of hardware status logs for an EVSE with optional date filtering.',
  props: {
        
  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),

  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'ISO 8601 formatted date. Only list status logs created after this datetime',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'ISO 8601 formatted date. Only list status logs created before this datetime',
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
  async run(context): Promise<ListEvseHardwareStatusLogsResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evses/v2.0/{evse}/hardware-status-logs', context.propsValue);
      
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
      }) as ListEvseHardwareStatusLogsResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListEvseHardwareStatusLogsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
