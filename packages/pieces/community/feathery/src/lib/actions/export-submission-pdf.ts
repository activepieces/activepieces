import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

export const exportSubmissionPdfAction = createAction({
  auth: featheryAuth,
  name: 'export_submission_pdf',
  displayName: 'Export Form Submission PDF',
  description: 'Create a PDF export for a specific form submission.',
  props: {
    form_id: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to export submission from.',
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
    user_id: Property.Dropdown({
      displayName: 'User',
      description: 'Select the user whose submission to export.',
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

        const users = await featheryCommon.apiCall<
          Array<{ id: string; created_at: string; updated_at: string }>
        >({
          method: HttpMethod.GET,
          url: '/user/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: users.map((user) => ({
            label: user.id,
            value: user.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { form_id, user_id } = context.propsValue;

    const response = await featheryCommon.apiCall<{
      pdf_url: string;
    }>({
      method: HttpMethod.POST,
      url: '/form/submission/pdf/',
      apiKey: context.auth.secret_text,
      body: {
        form_id,
        user_id,
      },
    });

    return response;
  },
});

