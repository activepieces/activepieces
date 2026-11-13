import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { fieldsJsonProp, recordIdProp, recordOutput } from '../../ai-common';
import { recordFromJson } from '../../common';
import { aiRecordSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export function reviseElement({ recordId, fields }: { recordId: unknown; fields: unknown }): string {
  const id = assertRecordId({ value: recordId });
  const values = recordFromJson({ value: fields, label: 'Fields' });
  const { id: givenId, ...rest } = values;
  if (givenId !== undefined && givenId !== id) {
    throw new Error('Fields contains an id different from Record ID');
  }
  if (Object.keys(rest).length === 0) {
    throw new Error('Fields must contain at least one field to change');
  }
  return JSON.stringify({ ...rest, id });
}

export const updateRecordFieldsAction = createAction({
  auth: vtigerAuth,
  name: 'update_record_fields',
  displayName: 'Update Record Fields',
  description: 'Changes only the given fields of a Vtiger record.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you pass on one record (Vtiger revise); every other field keeps its value and mandatory fields need not be restated. Send an empty string to clear a field. Re-running with the same values leaves the record unchanged.',
    idempotent: true,
  },
  outputSchema: aiRecordSchema,
  props: {
    recordId: recordIdProp(),
    fields: fieldsJsonProp({
      description: 'JSON object of only the fields to change, for example {"leadstatus": "Contacted"}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const record = await vtigerRest<Record<string, unknown>>({
      creds: auth.props,
      method: HttpMethod.POST,
      path: 'revise',
      form: { element: reviseElement({ recordId: propsValue.recordId, fields: propsValue.fields }) },
    });
    return recordOutput(record);
  },
});
