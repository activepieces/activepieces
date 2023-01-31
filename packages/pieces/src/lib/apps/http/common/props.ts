import { HttpMethod } from '../../../common/http/core/http-method';
import { Property } from '../../../framework/property';

const httpMethodDropdownOptions = Object.values(HttpMethod).map(m => ({
  label: m,
  value: m,
}));

export const httpMethodDropdown = Property.Dropdown<HttpMethod>({
  displayName: 'Method',
  required: true,
  refreshers: [],
  async options() {
    return {
      disabled: false,
      options: httpMethodDropdownOptions,
    };
  }
});
