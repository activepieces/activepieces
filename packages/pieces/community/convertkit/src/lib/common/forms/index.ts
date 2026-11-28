import { Property } from '@activepieces/pieces-framework';
import { fetchForms } from '../../common/service';
import { convertkitAuth } from '../../auth';

export const formId = Property.Dropdown({
  displayName: 'Form',
  description: 'A form in your Kit account.',
  required: true,
  refreshers: ['auth'],
  auth: convertkitAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    const forms = await fetchForms(auth.secret_text);

    // loop through data and map to options
    const options = forms.map((field: { id: string; name: string }) => {
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
