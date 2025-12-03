import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const certificateReissueAnEmaidAction = createAction({
  auth: ampecoAuth,
  name: 'certificateReissueAnEmaid',
  displayName: 'Actions - Id Tag - Certificate Reissue An Emaid',
  description: 'Certificate / Reissue an EMAID. (Endpoint: POST /public-api/actions/id-tag/v1.0/{idTag}/reissue-emaid)',
  props: {
        
  idTag: Property.Number({
    displayName: 'Id Tag',
    description: '',
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
