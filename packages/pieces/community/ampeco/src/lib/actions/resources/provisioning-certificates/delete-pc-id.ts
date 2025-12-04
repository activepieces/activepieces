import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deletePcIdAction = createAction({
  auth: ampecoAuth,
  name: 'deletePcId',
  displayName: 'Resources - Provisioning Certificates - Delete Pc Id',
  description: 'Delete a provisioning certificate. (Endpoint: DELETE /public-api/resources/provisioning-certificates/v2.0/{provisioningCertificate})',
  props: {
        
  provisioningCertificate: Property.Number({
    displayName: 'Provisioning Certificate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/provisioning-certificates/v2.0/{provisioningCertificate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
