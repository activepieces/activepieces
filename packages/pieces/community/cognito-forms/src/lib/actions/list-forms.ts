import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { listForms } from '../common/entries';
import { listFormsOutputSchema } from '../output-schemas';

export const listFormsAction = createAction({
  auth: cognitoFormsAuth,
  name: 'list_forms',
  classification: 'SEARCH',
  displayName: 'List Forms',
  description: 'Lists the forms the API key can access.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists all non-archived Cognito Forms forms the API key can access, with each form ID, name and internal name. Use it to find the form ID other actions need. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listFormsOutputSchema,
  props: {},
  async run(context) {
    const forms = await listForms(context.auth.secret_text);
    return {
      count: forms.length,
      forms: forms.map((form) => ({
        id: form.Id ?? null,
        name: form.Name ?? null,
        internal_name: form.InternalName ?? null,
      })),
    };
  },
});
