import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  countryDropdownOptions,
  request,
  serviceDropdownOptions,
  virtualSmsAuth,
} from '../common';

export const checkPrice = createAction({
  auth: virtualSmsAuth,
  name: 'check_price',
  displayName: 'Check Price',
  description: 'Look up the current price for a service/country combination before purchasing.',
  props: {
    service: Property.Dropdown<string, true, typeof virtualSmsAuth>({
      auth: virtualSmsAuth,
      displayName: 'Service',
      description: 'Select the service to check pricing for.',
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
    return request(auth, HttpMethod.GET, '/api/v1/price', undefined, {
      service: propsValue.service ?? undefined,
      country: propsValue.country ?? undefined,
    });
  },
});
