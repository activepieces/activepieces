import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/evse/v1.0/{evse}/trigger-message

export const evseTriggerMessageAction = createAction({
  auth: ampecoAuth,
  name: 'evseTriggerMessage',
  displayName: 'Actions - EVSE - Trigger Message',
  description: 'Trigger message to given EVSE.',
  props: {
        
  evse: Property.Number({
    displayName: 'EVSE',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: 'The type of the message to be triggered. Messages available only for 2.0.1 chargers - LogStatusNotification, PublishFirmwareStatusNotification, SignChargingStationCertificate, SignCombinedCertificate, TransactionEvent',
    required: true,
    options: {
      options: [
      { label: 'BootNotification', value: 'BootNotification' },
      { label: 'DiagnosticsStatusNotification', value: 'DiagnosticsStatusNotification' },
      { label: 'LogStatusNotification', value: 'LogStatusNotification' },
      { label: 'FirmwareStatusNotification', value: 'FirmwareStatusNotification' },
      { label: 'PublishFirmwareStatusNotification', value: 'PublishFirmwareStatusNotification' },
      { label: 'Heartbeat', value: 'Heartbeat' },
      { label: 'MeterValues', value: 'MeterValues' },
      { label: 'StatusNotification', value: 'StatusNotification' },
      { label: 'SignV2GCertificate', value: 'SignV2GCertificate' },
      { label: 'SignChargingStationCertificate', value: 'SignChargingStationCertificate' },
      { label: 'SignCombinedCertificate', value: 'SignCombinedCertificate' },
      { label: 'TransactionEvent', value: 'TransactionEvent' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/evse/v1.0/{evse}/trigger-message', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['type']
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
