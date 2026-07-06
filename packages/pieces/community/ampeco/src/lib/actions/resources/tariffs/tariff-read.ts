import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TariffReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/tariffs/v1.0/{tariff}
export const tariffReadAction = createAction({
  auth: ampecoAuth,
  name: 'tariffRead',
  displayName: 'Resources - Tariffs - Read',
  description: 'Get a tariff.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single AMPECO tariff by its numeric ID, returning its full pricing definition and settings. Use when you already know the tariff ID; to search or browse tariffs (including resolving the tariff that applies to a user within a group) use the tariffs listing action. Read-only and idempotent.', idempotent: true },
  props: {
        
  tariff: Property.Number({
    displayName: 'Tariff',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TariffReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariffs/v1.0/{tariff}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TariffReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
