import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

export const deleteFormAction = createAction({
  auth: featheryAuth,
  name: 'delete_form',
  displayName: 'Delete Form',
  description: 'Delete a specific form.',
  props: {
    form_id: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to delete.',
      required: true,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const forms = await featheryCommon.apiCall<
          Array<{ id: string; name: string; active: boolean }>
        >({
          method: HttpMethod.GET,
          url: '/form/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.name,
            value: form.id,
          })),
        };
      },
    }),
    confirm_delete: Property.Checkbox({
      displayName: 'Confirm Delete',
      description: 'Check to confirm deletion. This action cannot be undone.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { form_id, confirm_delete } = context.propsValue;

    if (!confirm_delete) {
      throw new Error('You must confirm the deletion by checking the confirm box.');
    }

    await featheryCommon.apiCall({
      method: HttpMethod.DELETE,
      url: `/form/${form_id}/`,
      apiKey: context.auth.secret_text,
      body: { confirm_delete: true },
    });

    return {
      success: true,
      message: `Form ${form_id} deleted successfully.`,
    };
  },
});

