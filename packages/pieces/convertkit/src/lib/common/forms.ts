import { Property, Validators } from '@activepieces/pieces-framework';
import { CONVERTKIT_API_URL } from './constants';

export const API_ENDPOINT = 'forms';

export const fetchForms = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
};

export const formId = Property.Dropdown({
  displayName: 'Form',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const forms = await fetchForms(auth.toString());

    // loop through data and map to options
    const options = forms.forms.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});

export const email = Property.ShortText({
  displayName: 'Email',
  description: 'The email of the subscriber',
  required: true,
  validators: [Validators.email],
});
export const firstName = Property.ShortText({
  displayName: 'First Name',
  description: 'The first name of the subscriber',
  required: false,
});
