import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon } from '../common';
import { formOutputSchema } from '../output-schemas';

export const updateFormAction = createAction({
  auth: typeformAuth,
  name: 'update_form',
  classification: 'WRITE',
  displayName: 'Update Form',
  description: "Changes a form's title, public status, theme or workspace.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Change a Typeform form's title, public status (whether it accepts responses), theme or workspace. Only the fields you set change; questions are untouched. To change questions use Replace Form or Update Choice Options. Returns the updated form.",
    idempotent: true,
  },
  outputSchema: formOutputSchema,
  props: {
    form_id: typeformCommon.formId,
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    isPublic: Property.StaticDropdown({
      displayName: 'Public',
      description: 'Whether the form is open and accepts responses.',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'true' },
          { label: 'Closed', value: 'false' },
        ],
      },
    }),
    theme: typeformCommon.themeId,
    workspace: typeformCommon.workspaceId,
  },
  async run({ auth, propsValue }) {
    const { form_id, title, isPublic, theme, workspace } = propsValue;
    const operations = [
      ...(typeformCommon.isProvided(title) ? [{ op: 'replace', path: '/title', value: title }] : []),
      ...(typeformCommon.isProvided(isPublic) ? [{ op: 'replace', path: '/settings/is_public', value: isPublic === 'true' }] : []),
      ...(typeformCommon.isProvided(theme)
        ? [{ op: 'replace', path: '/theme', value: typeformCommon.toHref({ resource: 'themes', id: theme }) }]
        : []),
      ...(typeformCommon.isProvided(workspace)
        ? [{ op: 'replace', path: '/workspace', value: typeformCommon.toHref({ resource: 'workspaces', id: workspace }) }]
        : []),
    ];
    if (operations.length === 0) {
      throw new Error('Set at least one of Title, Public, Theme or Workspace.');
    }
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.PATCH,
      path: `/forms/${encodeURIComponent(form_id)}`,
      body: operations,
    });
    return typeformCommon.getForm({ token: auth.access_token, formId: form_id });
  },
});
