import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordIdProp } from '../../ai-common';
import { deleteResultSchema } from '../../output-schemas';
import { deleteRestRecord } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export const deleteRecordByIdAction = createAction({
  auth: vtigerAuth,
  name: 'delete_record_by_id',
  displayName: 'Delete Record by ID',
  description: 'Deletes a Vtiger record (moves it to the Recycle Bin).',
  classification: 'DESTRUCTIVE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one record by webservice ID. Vtiger moves it to the Recycle Bin, where only an admin can restore it from the web UI. Deleting an ID that is already gone fails with HTTP 400.',
    idempotent: false,
  },
  outputSchema: deleteResultSchema,
  props: {
    recordId: recordIdProp(),
  },
  async run({ auth, propsValue }) {
    const id = assertRecordId({ value: propsValue.recordId });
    await deleteRestRecord({ creds: auth.props, id });
    return { id, deleted: true };
  },
});
