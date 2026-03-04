import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth } from '../auth';
import { prepareQuery } from '../common/client';

export const findRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_get_record',
  displayName: 'Get Record',
  description: 'Retrieves a single record from a table by its ID.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to retrieve (e.g. recXXXXXXX).',
      required: true,
    }),

  },
  async run(context) {
    const { table_id, recordId, } = context.propsValue;

    const client = makeClient(context.auth.props);

    return await client.getRecord(
      table_id,
      recordId,
      prepareQuery()
    );
  },
});

