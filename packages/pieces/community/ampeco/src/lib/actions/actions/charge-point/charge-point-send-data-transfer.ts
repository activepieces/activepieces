import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointSendDataTransferResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/send-data-transfer
export const chargePointSendDataTransferAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSendDataTransfer',
  displayName: 'Actions - Charge Point - Send Data Transfer',
  description: 'Charge Point / Send Data Transfer.',
  audience: 'both',
  aiMetadata: { description: 'Send an OCPP DataTransfer message to a charge point carrying vendor-specific data, identified by a vendor id and optional message id and free-form data payload. Use to invoke proprietary/vendor extensions not covered by standard OCPP actions. Effects depend on the vendor implementation, so treat it as a non-idempotent command.', idempotent: false },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  vendorId: Property.ShortText({
    displayName: 'Vendor Id',
    description: 'The identifier of the vendor specific implementation.',
    required: true,
  }),

  messageId: Property.ShortText({
    displayName: 'Message Id',
    description: 'Additional identification field.',
    required: false,
  }),

  data: Property.ShortText({
    displayName: 'Data',
    description: 'Data without specified length or format',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointSendDataTransferResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/send-data-transfer', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['vendorId', 'messageId', 'data']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointSendDataTransferResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
