import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest } from '../common/client';
import { formPath } from '../common/entries';
import { formIdText, readSchemaFields } from '../common/props';
import { formSchemaOutputSchema } from '../output-schemas';

export const getFormSchemaAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_form_schema',
  classification: 'READ',
  displayName: 'Get Form Schema',
  description: 'Gets the fields of a form: names, types and which are required or read-only.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the field list of one Cognito Forms form (name, type, required, read-only, allowed values) plus the raw JSON schema. Call it before creating or updating an entry to know the exact field names and value shapes. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: formSchemaOutputSchema,
  props: {
    form_id: formIdText,
  },
  async run(context) {
    const { form_id } = context.propsValue;
    const schema = await cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `${formPath(form_id)}/schema`,
    });
    const fields = readSchemaFields(schema).map((field) => ({
      name: field.name,
      title: field.title ?? null,
      type: field.type,
      required: field.required,
      read_only: field.readOnly,
      description: field.description ?? null,
      allowed_values: field.enumValues,
    }));
    return { form_id, field_count: fields.length, fields, raw_schema: schema };
  },
});
