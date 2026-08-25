import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetPcIdResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/provisioning-certificates/v2.0/{provisioningCertificate}

export const getPcIdAction = createAction({
  auth: ampecoAuth,
  name: 'getPcId',
  displayName: 'Resources - Provisioning Certificates - Get Pc Id',
  description: 'Get a Provisioning Certificate.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single AMPECO provisioning certificate by its numeric ID. Read-only and idempotent; use when you already have the certificate ID. To find IDs first, use the list pc ids action.', idempotent: true },
  props: {
        
  provisioningCertificate: Property.Number({
    displayName: 'Provisioning Certificate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetPcIdResponse> {
    try {
      const url = processPathParameters('/public-api/resources/provisioning-certificates/v2.0/{provisioningCertificate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetPcIdResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
