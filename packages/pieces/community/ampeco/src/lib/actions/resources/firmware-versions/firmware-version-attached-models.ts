import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { FirmwareVersionAttachedModelsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/firmware-versions/v1.0/{firmwareVersion}/attached-models

export const firmwareVersionAttachedModelsAction = createAction({
  auth: ampecoAuth,
  name: 'firmwareVersionAttachedModels',
  displayName: 'Resources - Firmware Versions - Get Attached Models',
  description: 'Get all charge point models attached to this firmware version.',
  props: {
        
  firmwareVersion: Property.Number({
    displayName: 'Firmware Version',
    description: '',
    required: true,
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
  async run(context): Promise<FirmwareVersionAttachedModelsResponse> {
    try {
      const url = processPathParameters('/public-api/resources/firmware-versions/v1.0/{firmwareVersion}/attached-models', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'cursor']);
      
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
      }) as FirmwareVersionAttachedModelsResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as FirmwareVersionAttachedModelsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
