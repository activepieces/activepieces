import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/sync-certificates

export const chargePointGetInstalledCertificateIdsAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointGetInstalledCertificateIds',
  displayName: 'Actions - Charge Point - Get Installed Certificate Ids',
  description: 'Charge Point / Get Installed Certificate IDs. ',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  certificateType: Property.StaticDropdown({
    displayName: 'Certificate Type',
    description: 'Indicates the type of certificates requested. Default value to be empty - the system should interpret the Null/empty value that all certificate types are requested.',
    required: false,
    options: {
      options: [
      { label: 'V2GRootCertificate', value: 'V2GRootCertificate' },
      { label: 'MORootCertificate', value: 'MORootCertificate' },
      { label: 'CSMSRootCertificate', value: 'CSMSRootCertificate' },
      { label: 'V2GCertificateChain', value: 'V2GCertificateChain' },
      { label: 'ManufacturerRootCertificate', value: 'ManufacturerRootCertificate' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/sync-certificates', context.propsValue);
      
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
