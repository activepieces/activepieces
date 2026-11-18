import { createAction, Property } from '@activepieces/pieces-framework';
import { knackAuth } from '../common/auth';
import { knackGetObject } from '../common/props';
import { getObjectFieldsOutputSchema } from '../common/schemas';

export const getObjectFieldsAction = createAction({
  auth: knackAuth,
  name: 'get_object_fields',
  classification: 'READ',
  displayName: 'Get Object Fields (Agent)',
  description: 'Lists the fields of a Knack object.',
  audience: 'ai',
  outputSchema: getObjectFieldsOutputSchema,
  aiMetadata: {
    description: 'Returns the fields of one Knack object: field key (e.g. "field_12"), name, type, whether it is required or unique, and the allowed options for multiple-choice fields. Use it to map human field names to the field keys that Search, Create and Update Record (Agent) expect. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    object_key: Property.ShortText({
      displayName: 'Object Key',
      description: 'Knack object key such as object_1, from List Objects (Agent).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const objectKey = propsValue.object_key.trim();
    const response = await knackGetObject({ auth, objectKey });
    return {
      object_key: response.object.key ?? objectKey,
      name: response.object.name ?? null,
      fields: response.object.fields.map((field) => ({
        key: field.key,
        name: field.name,
        type: field.type,
        required: field.required ?? false,
        unique: field.unique ?? false,
        options: field.format?.options ?? null,
      })),
    };
  },
});
