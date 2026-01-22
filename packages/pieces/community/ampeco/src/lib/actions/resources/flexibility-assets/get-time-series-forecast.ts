import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetTimeSeriesForecastResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}/time-series-forecast

export const getTimeSeriesForecastAction = createAction({
  auth: ampecoAuth,
  name: 'getTimeSeriesForecast',
  displayName: 'Resources - Flexibility Assets - Get Time Series Forecast',
  description: 'Get Time Series Forecast for a Flexibility Asset.',
  props: {
        
  flexibilityAsset: Property.Number({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),

  filter__startTime: Property.DateTime({
    displayName: 'Filter - Start Time',
    description: '',
    required: false,
  }),

  filter__endTime: Property.DateTime({
    displayName: 'Filter - End Time',
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
  async run(context): Promise<GetTimeSeriesForecastResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}/time-series-forecast', context.propsValue);
      
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
      }) as GetTimeSeriesForecastResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetTimeSeriesForecastResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
