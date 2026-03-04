import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth } from '../auth';
import { prepareQuery } from '../common/client';

export const findRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_records',
  displayName: 'List Records',
  description: 'Retrieves a list of records from a table with optional filtering, sorting, and pagination.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'A filter expression for the records. Use the visual query builder at https://app.teable.io/developer/tool/query-builder to build one.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id,  filter } = context.propsValue;

    const client = makeClient(context.auth.props);

    return await client.listRecords(
      table_id,
      prepareQuery({filter })
    );
  },
});

