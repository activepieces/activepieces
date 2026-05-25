import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const buyNumber = createAction({
  auth: virtualSmsAuth,
  name: 'buy_number',
  displayName: 'Buy Number',
  description: 'Purchase a phone number for a service + country combination',
  props: {
    service: Property.ShortText({
      displayName: 'Service Code',
      description:
        "Short service code (e.g. 'wa' for WhatsApp, 'tg' for Telegram). Use 'List Services' to discover codes — they are NOT slugs.",
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'ISO 2-letter country code (e.g. US, GB, DE, AR)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.POST, '/api/v1/customer/purchase', {
      service: propsValue.service,
      country: propsValue.country,
    });
  },
});
