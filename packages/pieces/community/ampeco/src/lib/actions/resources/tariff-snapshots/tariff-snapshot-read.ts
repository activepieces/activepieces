import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TariffSnapshotReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const tariffSnapshotReadAction = createAction({
  auth: ampecoAuth,
  name: 'tariffSnapshotRead',
  displayName: 'Resources - Tariff Snapshots - Tariff Snapshot Read',
  description: 'Get a tariff snapshot by id. (Endpoint: GET /public-api/resources/tariff-snapshots/v1.0/{tariffSnapshot})',
  props: {
        
  tariffSnapshot: Property.Number({
    displayName: 'Tariff Snapshot',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TariffSnapshotReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariff-snapshots/v1.0/{tariffSnapshot}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TariffSnapshotReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
