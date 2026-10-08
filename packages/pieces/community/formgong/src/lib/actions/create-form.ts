import { createAction, Property } from '@activepieces/pieces-framework';
import { formgongAuth } from '../auth';
import { formgongApi } from '../common/client';

export const createFormAction = createAction({
  auth: formgongAuth,
  name: 'create_form',
  classification: 'WRITE',
  displayName: 'Create Form',
  description: 'Creates a new form and returns its public access key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Formgong form and get its id and public access key (fk_…), which a website form sends in its hidden access_key field. Submissions are emailed to the account owner by default. Each call creates another form, so retries duplicate.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Form Name',
      description:
        'Shown in the Formgong dashboard and in the subject of notification emails. Up to 80 characters.',
      required: true,
      placeholder: 'Contact – example.com',
    }),
  },
  async run(context) {
    const { form } = await formgongApi.callTool<{
      form: { id: string; name: string; access_key: string; endpoint: string };
    }>({
      token: context.auth.secret_text,
      tool: 'create_form',
      args: { name: context.propsValue.name },
    });
    return {
      form_id: form.id,
      form_name: form.name,
      access_key: form.access_key,
      submit_url: form.endpoint,
    };
  },
});
