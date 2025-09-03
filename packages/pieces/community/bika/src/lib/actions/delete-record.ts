import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, makeClient } from '../common';
import { BikaAuth } from '../../index';

export const deleteRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record in database by ID.',
  props: {
    space_id: BikaCommon.space_id,
    database_id: BikaCommon.database_id,
      recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to delete.',
      required: true,
    }),
  },
  async run(context) {
    const databaseId = context.propsValue.database_id;
    const spaceId = context.propsValue.space_id;
    const recordId = context.propsValue.recordId;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof BikaAuth>
    );

    const response: any = await client.deleteRecord(
      spaceId,
      databaseId,
      recordId,
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
