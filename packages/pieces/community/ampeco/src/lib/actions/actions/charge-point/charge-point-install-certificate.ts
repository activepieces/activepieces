import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointInstallCertificateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointInstallCertificate',
  displayName: 'Actions - Charge Point - Charge Point Install Certificate',
  description: 'Charge Point / Install Certificate. (Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/install-certificate)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  certificateType: Property.StaticDropdown({
    displayName: 'Certificate Type',
    description: 'Indicates the type of certificate that is to be installed on the CP.',
    required: true,
    options: {
      options: [
      { label: 'V2GRootCertificate', value: 'V2GRootCertificate' },
      { label: 'MORootCertificate', value: 'MORootCertificate' },
      { label: 'CSMSRootCertificate', value: 'CSMSRootCertificate' },
      { label: 'ManufacturerRootCertificate', value: 'ManufacturerRootCertificate' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/install-certificate', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['certificateType']
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
