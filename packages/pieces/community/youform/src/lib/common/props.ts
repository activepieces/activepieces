import { DropdownState, Property } from '@activepieces/pieces-framework';
import { youformAuth } from '../auth';
import { youformApi } from './api';

function formId<R extends boolean>({
  required,
  displayName = 'Form',
  description,
}: PropParams<R>) {
  return Property.Dropdown({
    auth: youformAuth,
    displayName,
    description,
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }

      const response = await youformApi.listForms({ auth });

      return {
        disabled: false,
        options: response.data.data.map((form) => ({
          label: form.name,
          value: form.slug,
        })),
      };
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const youformProps = { formId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
