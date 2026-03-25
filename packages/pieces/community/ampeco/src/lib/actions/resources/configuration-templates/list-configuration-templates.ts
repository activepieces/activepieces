import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListConfigurationTemplatesResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/configuration-templates/v1.0

export const listConfigurationTemplatesAction = createAction({
  auth: ampecoAuth,
  name: 'listConfigurationTemplates',
  displayName: 'Resources - Configuration Templates - List Configuration Templates',
  description: 'Get all Configuration Templates.',
  props: {
        
  filter__ocppVersion: Property.StaticDropdown({
    displayName: 'Filter - Ocpp Version',
    description: 'The OCPP version to filter by',
    required: false,
    options: {
      options: [
      { label: 'ocpp1.6', value: 'ocpp1.6' },
      { label: 'ocpp2.0.1', value: 'ocpp2.0.1' }
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
  async run(context): Promise<ListConfigurationTemplatesResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0', context.propsValue);
      
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
      }) as ListConfigurationTemplatesResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListConfigurationTemplatesResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
