import { Property } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from './client';

export const formioProps = {
  formPath: Property.Dropdown({
    auth: formioAuth,
    displayName: 'Form',
    description: 'The form whose submissions this step works with',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect a Form.io project first',
        };
      }

      try {
        const forms = await formioCommon.listForms({ auth: auth.props });
        if (forms.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This project has no forms yet',
          };
        }
        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.title ?? form.name ?? form.path,
            value: form.path,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load forms from this Form.io project',
        };
      }
    },
  }),

  submissionId: Property.ShortText({
    displayName: 'Submission ID',
    description: "The submission's `_id`",
    required: true,
  }),

  submissionData: Property.Json({
    displayName: 'Submission Data',
    description:
      'The submission fields, keyed by the form component keys, for example {"fullName": "Amina Haddad", "email": "amina@example.gov"}',
    required: true,
  }),
};
