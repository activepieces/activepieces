import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { formOutputSchema } from '../output-schemas';

export const updateChoiceOptionsAction = createAction({
  auth: typeformAuth,
  name: 'update_choice_options',
  classification: 'WRITE',
  displayName: 'Update Choice Options',
  description: 'Replaces the options of a dropdown, multiple choice or ranking question.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replace the list of options of one dropdown, multiple choice, ranking or picture choice question in a Typeform form; the question is found by field ID or ref from Get Form, including inside question groups. Options whose label already exists keep their id, so their past answers stay linked. The rest of the form is unchanged, but an edit made in Typeform at the same moment can be lost. Returns the updated form.',
    idempotent: true,
  },
  outputSchema: formOutputSchema,
  props: {
    form_id: typeformCommon.form,
    field: typeformCommon.choiceField,
    choices: Property.Array({
      displayName: 'Options',
      description: 'The full new list of option labels, in order.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { form_id, field, choices } = propsValue;
    const labels = typeformCommon.toStringList({ values: choices });
    if (labels.length === 0) {
      throw new Error('Options must contain at least one label.');
    }
    const form = await typeformCommon.getForm({ token: auth.access_token, formId: form_id });
    const target = typeformCommon
      .flattenFields({ fields: form['fields'] })
      .find((item) => item['id'] === field.trim() || item['ref'] === field.trim());
    if (target === undefined) {
      throw new Error(`No question with field ID or ref "${field}" in this form.`);
    }
    if (!typeformCommon.choiceFieldTypes.includes(String(target['type']))) {
      throw new Error(`Question "${String(target['title'])}" is a ${String(target['type'])} question, not a choice question.`);
    }
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.PUT,
      path: `/forms/${encodeURIComponent(form_id)}`,
      body: typeformCommon.toFormPayload({
        form: {
          ...form,
          fields: replaceChoices({ fields: form['fields'], targetId: target['id'], labels }),
        },
      }),
    });
  },
});

function replaceChoices({
  fields,
  targetId,
  labels,
}: {
  fields: unknown;
  targetId: unknown;
  labels: string[];
}): unknown {
  if (!Array.isArray(fields)) {
    return fields;
  }
  return fields.map((field) => {
    if (!typeformCommon.isRecord(field) || !typeformCommon.isRecord(field['properties'])) {
      return field;
    }
    const properties = field['properties'];
    if (field['id'] === targetId) {
      const existing = Array.isArray(properties['choices']) ? properties['choices'].filter(typeformCommon.isRecord) : [];
      return {
        ...field,
        properties: {
          ...properties,
          choices: labels.map((label) => existing.find((choice) => choice['label'] === label) ?? { label }),
        },
      };
    }
    if (Array.isArray(properties['fields'])) {
      return { ...field, properties: { ...properties, fields: replaceChoices({ fields: properties['fields'], targetId, labels }) } };
    }
    return field;
  });
}
