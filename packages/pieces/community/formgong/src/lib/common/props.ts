import { Property } from '@activepieces/pieces-framework';
import { formgongAuth } from '../auth';
import { formgongApi, FormgongForm } from './client';

export const formgongProps = {
  form: () =>
    Property.Dropdown({
      auth: formgongAuth,
      displayName: 'Form',
      description:
        'The Formgong form to use. The access key in brackets is the one in your form code.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Formgong account first',
          };
        }
        try {
          const { forms } = await formgongApi.callTool<{
            forms: FormgongForm[];
          }>({
            token: auth.secret_text,
            tool: 'list_forms',
          });
          if (forms.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No forms yet. Create one first.',
            };
          }
          return {
            disabled: false,
            options: forms.map((form) => ({
              label: `${form.name} (${form.access_key})`,
              value: form.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder:
              error instanceof Error
                ? error.message
                : 'Failed to load forms. Check your connection.',
          };
        }
      },
    }),
};
