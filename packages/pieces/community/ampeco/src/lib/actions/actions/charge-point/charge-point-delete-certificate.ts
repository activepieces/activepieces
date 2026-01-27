import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/delete-certificate

export const chargePointDeleteCertificateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDeleteCertificate',
  displayName: 'Actions - Charge Point - Delete Certificate',
  description: 'Delete certificate.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  certificateType: Property.StaticDropdown({
    displayName: 'Certificate Type',
    description: 'Indicates the type of certificate that is to be installed on the CP.',
    required: true,
    options: {
      options: [
      { label: 'ChargingStationCertificate', value: 'ChargingStationCertificate' },
      { label: 'V2GCertificate', value: 'V2GCertificate' },
      { label: 'V2GRootCertificate', value: 'V2GRootCertificate' },
      { label: 'MORootCertificate', value: 'MORootCertificate' },
      { label: 'CSMSRootCertificate', value: 'CSMSRootCertificate' },
      { label: 'ManufacturerRootCertificate', value: 'ManufacturerRootCertificate' },
      { label: 'V2GCertificateChain', value: 'V2GCertificateChain' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/delete-certificate', context.propsValue);
      
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
