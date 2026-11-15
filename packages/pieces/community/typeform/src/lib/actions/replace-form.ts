import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { formOutputSchema } from '../output-schemas';

export const replaceFormAction = createAction({
  auth: typeformAuth,
  name: 'replace_form',
  classification: 'DESTRUCTIVE',
  displayName: 'Replace Form',
  description: "Replaces a form's whole definition, including its questions.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Replace a Typeform form's whole definition (title, fields, screens, logic, settings) with the JSON you send. Call Get Form first and edit that result: any existing field missing from the definition, or sent without its original id, is deleted together with all its answers. The action refuses to delete fields unless Allow Field Deletion is on. The current theme is kept when the definition has none. For title, theme, workspace or public status use Update Form instead.",
    idempotent: true,
  },
  outputSchema: formOutputSchema,
  props: {
    form_id: typeformCommon.formId,
    definition: Property.Json({
      displayName: 'Form Definition',
      description: 'The full form JSON from Get Form, with your changes. Must include title.',
      required: true,
    }),
    allowFieldDeletion: Property.Checkbox({
      displayName: 'Allow Field Deletion',
      description: 'Allow removing existing questions. Their responses are deleted too.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { form_id, definition, allowFieldDeletion } = propsValue;
    if (!typeformCommon.isRecord(definition)) {
      throw new Error('Form Definition must be a JSON object.');
    }
    if (typeof definition['title'] !== 'string' || definition['title'].trim().length === 0) {
      throw new Error('Form Definition must include a title.');
    }
    const current = await typeformCommon.getForm({ token: auth.access_token, formId: form_id });
    const keptIds = typeformCommon.fieldIds({ fields: definition['fields'] });
    const removed = typeformCommon
      .flattenFields({ fields: current['fields'] })
      .filter((field) => typeof field['id'] === 'string' && !keptIds.includes(field['id']));
    if (removed.length > 0 && allowFieldDeletion !== true) {
      const names = removed.map((field) => `"${String(field['title'] ?? field['id'])}" (${String(field['id'])})`);
      throw new Error(
        `This would delete ${removed.length} question(s) and their responses: ${names.join(', ')}. Keep their ids in the definition, or turn on Allow Field Deletion.`
      );
    }
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.PUT,
      path: `/forms/${encodeURIComponent(form_id)}`,
      body: {
        ...typeformCommon.toFormPayload({ form: definition }),
        ...(definition['theme'] === undefined && current['theme'] !== undefined ? { theme: current['theme'] } : {}),
      },
    });
  },
});
