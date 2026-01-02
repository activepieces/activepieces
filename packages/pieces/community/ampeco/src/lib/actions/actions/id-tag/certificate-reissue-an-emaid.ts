import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/id-tag/v1.0/{idTag}/reissue-emaid
export const certificateReissueAnEmaidAction = createAction({
  auth: ampecoAuth,
  name: 'certificateReissueAnEmaid',
  displayName: 'Actions - Id Tag - Certificate Reissue An EMAID',
  description: 'Certificate / Reissue an EMAID.',
  props: {
        
  idTag: Property.Number({
    displayName: 'Id Tag',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/id-tag/v1.0/{idTag}/reissue-emaid', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
