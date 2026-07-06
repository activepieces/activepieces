import { createAction, Property } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { addGlideRows } from '../common/client';
import { glideProps } from '../common/props';
import { parseGlideRows, parseRequiredString } from '../common/utils';

export const addRowsAction = createAction({
  auth: glideAuth,
  name: 'add-rows',
  displayName: 'Add Rows',
  description: 'Add one or more rows to a Glide Big Table.',
  audience: 'both',
  aiMetadata: {
    description: 'Append one or more new rows to a Glide Big Table identified by table ID. Use to insert records; each row is a JSON object whose keys must match the table column IDs. Not idempotent — every call appends, so re-running creates duplicate rows.',
    idempotent: false,
  },
  props: {
    tableId: glideProps.tableId(),
    rows: Property.Json({
      displayName: 'Rows',
      description: 'Provide an array of JSON objects where each object matches the Glide table columns.',
      required: true,
    }),
  },
  async run(context) {
    const tableId = parseRequiredString(context.propsValue.tableId, 'Table');

    return addGlideRows({
      auth: context.auth,
      tableId,
      rows: parseGlideRows(context.propsValue.rows),
    });
  },
});
