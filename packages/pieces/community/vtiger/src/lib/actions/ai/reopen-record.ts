import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp } from '../../ai-common';
import { reopenRecordSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const reopenRecordAction = createAction({
  auth: vtigerAuth,
  name: 'reopen_record',
  displayName: 'Reopen Record',
  description: 'Reopens a closed Vtiger record such as a won or lost deal.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reopens a closed record by webservice ID, for example a deal in Closed Won or Closed Lost (its isclosed field is 1). Vtiger returns HTTP 400 when the record is not closed, including a Case whose status was only set to Closed. Requires permission to edit the record.',
    idempotent: false,
  },
  outputSchema: reopenRecordSchema,
  props: {
    recordId: recordIdProp(),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.recordId });
    const result = await vtigerRest<unknown>({ creds: auth.props, method: HttpMethod.POST, path: 'reopen', form: { id } });
    const message = isRecord(result) && typeof result['message'] === 'string' ? result['message'] : '';
    return { id, reopened: true, message };
  },
});
