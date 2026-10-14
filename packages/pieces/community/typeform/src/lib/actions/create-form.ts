import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { formOutputSchema } from '../output-schemas';

export const createFormAction = createAction({
  auth: typeformAuth,
  name: 'create_form',
  classification: 'WRITE',
  displayName: 'Create Form',
  description: 'Creates a new form, empty or with questions.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Typeform form with a title, optionally in a workspace, with a theme and with questions. Questions are a JSON array of Typeform field objects, for example [{"title":"Your email?","type":"email","validations":{"required":true}}]; leave empty for an empty form. Returns the new form with its ID and share link. Each call creates another form.',
    idempotent: false,
  },
  outputSchema: formOutputSchema,
  propertyGroups: [
    { key: 'form', display: 'section', label: 'New form', icon: 'file', props: ['title', 'workspace', 'theme'] },
    { key: 'content', display: 'section', label: 'Form content', icon: 'code', props: ['questions_info', 'fields'] },
  ],
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Customer feedback survey',
      required: true,
    }),
    workspace: typeformCommon.workspace,
    theme: typeformCommon.theme,
    questions_info: Property.MarkDown({
      value:
        'Questions use the [Typeform field format](https://www.typeform.com/developers/create/reference/create-form/). Leave empty to start with an empty form.',
      variant: MarkdownVariant.INFO,
    }),
    fields: Property.Json({
      displayName: 'Questions',
      description: 'A JSON array of Typeform question objects.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { title, workspace, theme, fields } = propsValue;
    if (!isEmptyQuestions({ fields }) && !Array.isArray(fields)) {
      throw new Error('Questions must be a JSON array of field objects.');
    }
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.POST,
      path: '/forms',
      body: {
        title,
        ...(typeformCommon.isProvided(workspace) ? { workspace: typeformCommon.toHref({ resource: 'workspaces', id: workspace }) } : {}),
        ...(typeformCommon.isProvided(theme) ? { theme: typeformCommon.toHref({ resource: 'themes', id: theme }) } : {}),
        ...(Array.isArray(fields) && fields.length > 0 ? { fields } : {}),
      },
    });
  },
});

function isEmptyQuestions({ fields }: { fields: unknown }): boolean {
  return fields === undefined || fields === null || (typeformCommon.isRecord(fields) && Object.keys(fields).length === 0);
}
