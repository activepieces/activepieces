import { createAction } from '@activepieces/pieces-framework';
import { typeformAuth } from '../auth';
import { typeformCommon } from '../common';
import { formOutputSchema } from '../output-schemas';

export const getFormAction = createAction({
  auth: typeformAuth,
  name: 'get_form',
  classification: 'READ',
  displayName: 'Get Form',
  description: 'Gets a form with its questions, logic and settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Typeform form by ID with its questions (fields, with IDs, refs, types and choices), welcome and thank-you screens, logic, hidden fields, settings, theme and workspace. Use it before Replace Form or Update Choice Options, and to read field IDs for response answers. Read-only.',
    idempotent: true,
  },
  outputSchema: formOutputSchema,
  props: {
    form_id: typeformCommon.formId,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.getForm({ token: auth.access_token, formId: propsValue.form_id });
  },
});
