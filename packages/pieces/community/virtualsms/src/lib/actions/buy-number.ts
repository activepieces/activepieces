import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  countryDropdownOptions,
  request,
  serviceDropdownOptions,
  virtualSmsAuth,
} from '../common';

export const buyNumber = createAction({
  auth: virtualSmsAuth,
  name: 'buy_number',
  displayName: 'Buy Number',
  description:
    'Purchase a phone number for a service + country combination. Balance is deducted immediately.',
  props: {
    service: Property.Dropdown<string, true, typeof virtualSmsAuth>({
      auth: virtualSmsAuth,
      displayName: 'Service',
      description: 'Select the service to receive a verification SMS for.',
      required: true,
      refreshers: [],
      async options({ auth }) {
        return serviceDropdownOptions(auth);
      },
    }),
    country: Property.Dropdown<string, true, typeof virtualSmsAuth>({
      auth: virtualSmsAuth,
      displayName: 'Country',
      description:
        'Select the country. The list updates based on the selected service.',
      required: true,
      refreshers: ['service'],
      async options({ auth, service }) {
        return countryDropdownOptions(auth, service);
      },
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.POST, '/api/v1/customer/purchase', {
      service: propsValue.service,
      country: propsValue.country,
    });
  },
});
