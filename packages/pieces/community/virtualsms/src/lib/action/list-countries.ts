import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const listCountries = createAction({
  auth: virtualSmsAuth,
  name: 'list_countries',
  displayName: 'List Countries',
  description:
    'List all available countries with their ISO codes, min prices, and supported services',
  props: {},
  async run({ auth }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/countries');
  },
});
