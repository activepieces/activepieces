import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TermsAndPoliciesReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: GET /public-api/resources/terms-and-policies/v2.0/{termVersion}
export const termsAndPoliciesReadAction = createAction({
  auth: ampecoAuth,
  name: 'termsAndPoliciesRead',
  displayName: 'Resources - Terms And Policies - Read',
  description: 'Terms and policies / Read.',
  props: {
        
  termVersion: Property.Number({
    displayName: 'Term Version',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TermsAndPoliciesReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/terms-and-policies/v2.0/{termVersion}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TermsAndPoliciesReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
