import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { makeRequest } from './index';
import { HttpMethod } from '@activepieces/pieces-common';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Form',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Cognito Forms account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const forms = await makeRequest(apiKey, HttpMethod.GET, '/forms');

    const options: DropdownOption<string>[] = forms.map((form: any) => ({
      label: form.Name,
      value: form.Id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
