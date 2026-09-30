import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { formOutputSchema } from '../output-schemas';

export const duplicateFormAction = createAction({
  auth: typeformAuth,
  name: 'duplicate_form',
  classification: 'WRITE',
  displayName: 'Duplicate Form',
  description: 'Creates a copy of an existing form.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a copy of a Typeform form with the same questions, screens, logic, settings and theme, optionally with a new title and in another workspace. Responses, translations and webhooks are not copied. Returns the new form. Each call creates another copy.',
    idempotent: false,
  },
  outputSchema: formOutputSchema,
  props: {
    form_id: typeformCommon.form,
    title: Property.ShortText({
      displayName: 'New Title',
      description: 'Defaults to "Copy of" and the original title.',
      required: false,
    }),
    workspace: typeformCommon.workspace,
  },
  async run({ auth, propsValue }) {
    const { form_id, title, workspace } = propsValue;
    const source = await typeformCommon.getForm({ token: auth.access_token, formId: form_id });
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.POST,
      path: '/forms',
      body: {
        ...typeformCommon.toDuplicatePayload({ form: source }),
        title: typeformCommon.isProvided(title) ? title : `Copy of ${String(source['title'] ?? '')}`.trim(),
        ...(typeformCommon.isProvided(workspace)
          ? { workspace: typeformCommon.toHref({ resource: 'workspaces', id: workspace }) }
          : {}),
      },
    });
  },
});
