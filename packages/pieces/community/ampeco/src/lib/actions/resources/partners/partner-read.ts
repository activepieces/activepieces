import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: GET /public-api/resources/partners/v2.0/{partner}
export const partnerReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerRead',
  displayName: 'Resources - Partners - Read',
  description: 'Get a partner.',
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
