import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/update-firmware

export const chargePointUpdateFirmwareAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointUpdateFirmware',
  displayName: 'Actions - Charge Point - Update Firmware',
  description: 'Charge Point / Update Firmware.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  url: Property.ShortText({
    displayName: 'URL',
    description: 'Location (URL) from which to retrieve the firmware. Either this or `firmwareVersionId` must be provided.',
    required: false,
  }),

  firmwareVersionId: Property.Number({
    displayName: 'Firmware Version Id',
    description: 'ID of a Firmware Version. Either this or `url` must be provided.',
    required: false,
  }),

  retrieveAfter: Property.DateTime({
    displayName: 'Retrieve After',
    description: 'Specifies the date and time after which the Charge Point should retrieve the new firmware. If not provided, the current *datetime* will be used.',
    required: false,
  }),

  retries: Property.Number({
    displayName: 'Retries',
    description: 'Specifies how many times the Charge Point must try to retrieve the (new) firmware before giving up.',
    required: false,
  }),

  interval: Property.Number({
    displayName: 'Interval',
    description: 'The interval in seconds between each retry.',
    required: false,
  }),

  signed: Property.StaticDropdown({
    displayName: 'Signed',
    description: 'Indicates a Signed Firmware Update.',
    required: true,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  signingCertificate: Property.ShortText({
    displayName: 'Signing Certificate',
    description: 'Required if "signed" is true.',
    required: false,
  }),

  signature: Property.ShortText({
    displayName: 'Signature',
    description: 'Required if "signed" is true.',
    required: false,
  }),

  downloadUrlProtocol: Property.StaticDropdown({
    displayName: 'Download Url Protocol',
    description: 'Protocol to use for the firmware download URL when using firmware repository. Use HTTP only if the charge point does not support encrypted connections.',
    required: false,
    options: {
      options: [
      { label: 'http', value: 'http' },
      { label: 'https', value: 'https' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/update-firmware', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['url', 'firmwareVersionId', 'retrieveAfter', 'retries', 'interval', 'signed', 'signingCertificate', 'signature', 'downloadUrlProtocol']
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
