import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { fieldsJsonProp, moduleProp, recordOutput, requiredText } from '../../ai-common';
import { recordFromJson } from '../../common';
import { findOrCreateSchema } from '../../output-schemas';
import { VtigerCredentials } from '../../rest-client';
import { assertFieldName, assertModuleName } from '../../vtql';
import { createModuleRecord } from './create-module-record';
import { searchModule } from './search-module-records';

export async function findOrCreate({
  creds,
  module,
  matchField,
  matchValue,
  fields,
}: {
  creds: VtigerCredentials;
  module: unknown;
  matchField: unknown;
  matchValue: unknown;
  fields: unknown;
}) {
  const name = assertModuleName(module);
  const field = assertFieldName(matchField);
  const value = requiredText({ value: matchValue, label: 'Match Value' });
  const extra = recordFromJson({ value: fields, label: 'Fields' });
  const { records } = await searchModule({
    creds,
    module: name,
    filters: [{ field, value, operator: '=' }],
    limit: 2,
  });
  if (records.length > 0) {
    return { created: false, matchCount: records.length, ...recordOutput(records[0]) };
  }
  const record = await createModuleRecord({ creds, module: name, fields: { ...extra, [field]: value } });
  return { created: true, matchCount: 0, ...recordOutput(record) };
}

export const findOrCreateRecordAction = createAction({
  auth: vtigerAuth,
  name: 'find_or_create_record',
  displayName: 'Find or Create Record',
  description: 'Returns the record whose field equals a value, or creates it when none exists.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a record in a module by one field (exact match, e.g. email) and returns the first match; only when nothing matches it creates a record with that value plus the given fields. Safe to retry only when the match field is unique in Vtiger; two concurrent calls can both create.',
    idempotent: false,
  },
  outputSchema: findOrCreateSchema,
  props: {
    module: moduleProp(),
    matchField: Property.ShortText({
      displayName: 'Match Field',
      description: 'Field API name to match on, for example email.',
      required: true,
    }),
    matchValue: Property.ShortText({
      displayName: 'Match Value',
      description: 'Value the field must equal exactly.',
      required: true,
    }),
    fields: fieldsJsonProp({
      description: 'JSON of fields used only when a record is created; include the mandatory fields, for example {"lastname": "Smith"}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return findOrCreate({ creds: auth.props, ...propsValue });
  },
});
