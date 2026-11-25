import {
  DropdownState,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
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

      const { data: forms, error } = await tryCatch(() =>
        youformApi.listAllForms({ auth })
      );

      if (error) {
        return disabledOptions({
          placeholder: "Couldn't load forms. Check connection.",
        });
      }

      if (forms.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No forms yet. Create one in Youform.',
        };
      }

      return {
        disabled: false,
        options: forms.map((form) => ({
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
