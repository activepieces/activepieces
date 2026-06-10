import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/provisioning-certificate/v1.0/{provisioningCertificate}/issue-emaid

export const certificateIssueAnEmaidAction = createAction({
  auth: ampecoAuth,
  name: 'certificateIssueAnEmaid',
  displayName: 'Actions - Provisioning Certificate - Certificate Issue An EMAID',
  description: 'Certificate / Issue an EMAID.',
  props: {
        
  provisioningCertificate: Property.Number({
    displayName: 'Provisioning Certificate',
    required: true,
  }),

  paymentMethod: Property.ShortText({
    displayName: 'Payment Method',
    description: `The payment method that will be associated with the EMAID Tag.\n* For **credit/debit cards** the \`paymentMethodId\` should be provided\n* For **Corporate billing** - \`corporate:{id}\`\n* For **last used** the value should be \`null\`\n`,
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/provisioning-certificate/v1.0/{provisioningCertificate}/issue-emaid', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['paymentMethod']
      );

      
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
