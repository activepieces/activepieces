import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const submitApplication = createAction({
  name: 'submit_application',
  auth: narmiAuth,
  displayName: 'Submit Application',
  description: 'Submit an account application for processing',
  props: {
    uuid: Property.ShortText({
      displayName: 'Application UUID',
      description: 'The UUID of the account application to submit',
      required: true,
    }),
    csrfToken: Property.ShortText({
      displayName: 'CSRF Token',
      description: 'CSRF token obtained from GET /csrf endpoint',
      required: true,
    }),
    selectedProducts: Property.Array({
      displayName: 'Selected Products',
      description: 'Array of product objects to submit with the application',
      required: true,
    }),
    deviceId: Property.ShortText({
      displayName: 'Device ID',
      description: 'Device ID to include in metadata (optional)',
      required: false,
    }),
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      description: 'UTM source to include in metadata (optional)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { uuid, csrfToken, selectedProducts, deviceId, utmSource } = context.propsValue;

    const body: any = {
      selected_products: selectedProducts,
    };

    if (deviceId) {
      body.device_id = deviceId;
    }

    if (utmSource) {
      body.utm_source = utmSource;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/v1/account_opening/${uuid}/`,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': csrfToken,
      },
      body,
    });

    return response.body;
  },
});
