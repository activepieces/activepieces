import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { fieldsJsonProp, moduleProp, recordOutput } from '../../ai-common';
import { recordFromJson } from '../../common';
import { aiRecordSchema } from '../../output-schemas';
import { VtigerCredentials, vtigerRest } from '../../rest-client';
import { assertModuleName } from '../../vtql';

export async function createModuleRecord({
  creds,
  module,
  fields,
}: {
  creds: VtigerCredentials;
  module: string;
  fields: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  if (Object.keys(fields).length === 0) {
    throw new Error('Fields must contain at least one field value');
  }
  if ('id' in fields) {
    throw new Error('Fields must not contain id when creating a record');
  }
  return vtigerRest<Record<string, unknown>>({
    creds,
    method: HttpMethod.POST,
    path: 'create',
    form: { elementType: assertModuleName(module), element: JSON.stringify(fields) },
  });
}

export const createModuleRecordAction = createAction({
  auth: vtigerAuth,
  name: 'create_module_record',
  displayName: 'Create Module Record',
  description: 'Creates a record in any Vtiger module from a JSON object of field values.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one record in a Vtiger module (e.g. Contacts, Leads, Cases) from field API names and values; mandatory fields (see Describe Module) must be included, and assigned_user_id defaults to the connected user when omitted. Each call creates a new record, so use Find or Create Record to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: aiRecordSchema,
  props: {
    module: moduleProp(),
    fields: fieldsJsonProp({
      description: 'JSON object of field API name to value, for example {"lastname": "Smith", "email": "jo@example.com"}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const record = await createModuleRecord({
      creds: auth.props,
      module: propsValue.module,
      fields: recordFromJson({ value: propsValue.fields, label: 'Fields' }),
    });
    return recordOutput(record);
  },
});
