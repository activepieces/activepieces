import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerRead',
  displayName: 'Resources - Partners - Partner Read',
  description: 'Get a partner. (Endpoint: GET /public-api/resources/partners/v2.0/{partner})',
  props: {
        
  partner: Property.Number({
    displayName: 'Partner',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnerReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partners/v2.0/{partner}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
