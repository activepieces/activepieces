import { Property, createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { deleteRecordActionOutputSchema } from '../output-schemas';

export const deleteRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes one or more records from a datasheet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one or more records from an AITable datasheet by record ID; obtain the IDs from Find Records first. Use only when records should be removed entirely, not just updated. Not idempotent: retrying after a successful delete errors because the records no longer exist.',
    idempotent: false,
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'The IDs of the records to delete.',
      required: true,
    }),
  },
  outputSchema: deleteRecordActionOutputSchema,
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id as string;
    const recordIds = context.propsValue.recordIds as string[];

    const client = makeClient(context.auth.props);
    const response = await client.deleteRecords(datasheetId, recordIds);

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
