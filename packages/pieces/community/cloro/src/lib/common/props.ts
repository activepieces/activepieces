import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { cloroAuth } from '../auth';
import { cloroApi } from './client';

export const countryProp = Property.Dropdown({
  auth: cloroAuth,
  displayName: 'Country',
  description: 'Results and answers as seen from this country.',
  required: true,
  defaultValue: 'US',
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your cloro account first',
      };
    }
    try {
      const codes = await cloroApi.send<unknown>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/v1/countries',
      });
      const list = Array.isArray(codes) ? codes.filter((code): code is string => typeof code === 'string') : [];
      return {
        disabled: false,
        options: list
          .map((code) => ({ label: `${cloroApi.countryName(code)} (${code})`, value: code }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load the countries. Check the connection.',
      };
    }
  },
});
