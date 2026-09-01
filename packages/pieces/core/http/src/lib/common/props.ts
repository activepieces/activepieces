import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

const httpMethodDropdownOptions = Object.values(HttpMethod).map((m) => ({
  label: m,
  value: m,
}));

export const httpMethodDropdown = Property.StaticDropdown<HttpMethod>({
  displayName: 'Method',
  description: 'The HTTP method for the request. Use GET to read data and POST to create it.',
  required: true,
  defaultValue: HttpMethod.GET,
  options: { options: httpMethodDropdownOptions },
});
