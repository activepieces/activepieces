import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp, recordOutput } from '../../ai-common';
import { aiRecordSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const getRecordByIdAction = createAction({
  auth: vtigerAuth,
  name: 'get_record_by_id',
  displayName: 'Get Record by ID',
  description: 'Retrieves one Vtiger record by its webservice ID.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches every field of one Vtiger record from its webservice ID (e.g. 12x345); the module is implied by the ID prefix. Use it when you already have the ID; to find a record by field values use Search Module Records.',
    idempotent: true,
  },
  outputSchema: aiRecordSchema,
  props: {
    recordId: recordIdProp(),
  },
  async run({ auth, propsValue }) {
    const record = await vtigerRest<Record<string, unknown>>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'retrieve',
      query: { id: assertRecordId({ value: propsValue.recordId }) },
    });
    return recordOutput(record);
  },
});
