import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, serviceDropdownOptions, virtualSmsAuth } from '../common';

export const listCountries = createAction({
  auth: virtualSmsAuth,
  name: 'list_countries',
  displayName: 'List Countries',
  description:
    'List available countries with ISO codes, min prices, and supported services.',
  props: {
    service: Property.Dropdown<string, false, typeof virtualSmsAuth>({
      auth: virtualSmsAuth,
      displayName: 'Service (optional filter)',
      description: 'Filter countries by service. Leave blank to return all countries.',
      required: false,
      refreshers: [],
      async options({ auth }) {
        return serviceDropdownOptions(auth);
      },
    }),
    include_voip: Property.Checkbox({
      displayName: 'Include VoIP Numbers',
      description: 'Include countries with VoIP-only numbers.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/countries', undefined, {
      service: propsValue.service ?? undefined,
      include_voip: propsValue.include_voip ? 'true' : undefined,
    });
  },
});
