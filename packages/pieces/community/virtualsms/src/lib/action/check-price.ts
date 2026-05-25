import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const checkPrice = createAction({
  auth: virtualSmsAuth,
  name: 'check_price',
  displayName: 'Check Price',
  description:
    'Look up the current price for a service/country combination before purchasing',
  props: {
    service: Property.ShortText({
      displayName: 'Service Code',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'ISO 2-letter country code',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.GET, '/api/v1/price', undefined, {
      service: propsValue.service,
      country: propsValue.country,
    });
  },
});
