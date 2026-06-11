import { createAction } from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';

export const deleteRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record from a Teable table by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently removes a single record from a Teable table by its record ID. Use when the agent must delete a known row. Effectively idempotent on the end state (the record stays gone), though a repeat call on an already-deleted ID may error.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
  },
  async run(context) {
    const { table_id, record_id } = context.propsValue;
    const client = makeClient(context.auth as TeableAuthValue);
    return await client.deleteRecord(table_id, record_id);
  },
});
