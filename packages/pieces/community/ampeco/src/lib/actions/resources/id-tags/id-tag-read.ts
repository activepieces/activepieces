import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { IdTagReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const idTagReadAction = createAction({
  auth: ampecoAuth,
  name: 'idTagRead',
  displayName: 'Resources - Id Tags - Id Tag Read',
  description: 'Get a Id Tag. (Endpoint: GET /public-api/resources/id-tags/v2.0/{idTag})',
  props: {
        
  idTag: Property.Number({
    displayName: 'Id Tag',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<IdTagReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/id-tags/v2.0/{idTag}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as IdTagReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
