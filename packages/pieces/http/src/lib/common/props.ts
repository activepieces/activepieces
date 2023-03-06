import { HttpMethod, Property } from "@activepieces/framework";

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
