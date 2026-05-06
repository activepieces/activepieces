import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { IdTagReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/id-tags/v2.0/{idTag}

export const idTagReadAction = createAction({
  auth: ampecoAuth,
  name: 'idTagRead',
  displayName: 'Resources - Id Tags - Read',
  description: 'Get a Id Tag.',
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
