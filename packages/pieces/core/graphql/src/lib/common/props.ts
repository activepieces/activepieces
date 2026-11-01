import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

const httpMethodDropdownOptions = Object.values(HttpMethod).map((m) => ({
  label: m,
  value: m,
}));

export const httpMethodDropdown = Property.StaticDropdown<HttpMethod>({
  displayName: 'Method',
  description: 'Most GraphQL APIs expect POST.',
  required: true,
  options: { options: httpMethodDropdownOptions },
  defaultValue: HttpMethod.POST,
});
