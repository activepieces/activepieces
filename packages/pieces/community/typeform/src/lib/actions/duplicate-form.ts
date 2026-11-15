import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Original', icon: 'file', props: ['form_id'] },
    { key: 'copy', display: 'section', label: 'The copy', icon: 'file', props: ['title', 'workspace', 'copy_info'] },
  ],
  props: {
    form_id: typeformCommon.form,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Leave empty for "Copy of" and the original title.',
      required: false,
    }),
    workspace: typeformCommon.copyWorkspace,
    copy_info: Property.MarkDown({
      value: 'Responses, translations and webhooks are not copied.',
      variant: MarkdownVariant.INFO,
    }),
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
