import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginAiProps } from '../common/props';
import { getBiginConnection } from '../common/request';
import { biginRecords } from '../common/records';
import { biginOutputSchemas } from '../common/output-schemas';

export const deleteRecord = createAction({
  auth: biginAuth,
  name: 'deleteRecord',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Delete a Bigin record by module and id.',
  audience: 'both',
  outputSchema: biginOutputSchemas.deleteResult,
  aiMetadata: {
    description:
      'Deletes one Bigin record (moves it to the recycle bin) by module and record id. Not idempotent: deleting the same id again fails with an error from Bigin.',
    idempotent: false,
  },
  props: {
    module: biginAiProps.module('The module of the record to delete.'),
    recordId: biginAiProps.id({ displayName: 'Record ID', description: 'Id of the record to delete.', required: true }),
  },
  async run(context) {
    const id = context.propsValue.recordId.trim();
    if (id === '') throw new Error('Record ID must not be empty.');
    return biginRecords.delete({
      connection: getBiginConnection(context.auth),
      module: context.propsValue.module,
      id,
    });
  },
});
