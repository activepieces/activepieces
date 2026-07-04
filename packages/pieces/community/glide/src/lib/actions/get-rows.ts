import { createAction, Property } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { getGlideRows } from '../common/client';
import { glideProps } from '../common/props';
import { flattenGlideRows, parseRequiredString } from '../common/utils';

export const getRowsAction = createAction({
  auth: glideAuth,
  name: 'get-rows',
  displayName: 'Get Rows',
  description: 'Retrieve rows from a Glide Big Table.',
  audience: 'both',
  aiMetadata: {
    description: 'Read rows from a Glide Big Table identified by table ID, paginating up to an optional limit (default 100). Use to fetch existing records for inspection or downstream processing. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    tableId: glideProps.tableId(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const tableId = parseRequiredString(context.propsValue.tableId, 'Table');

    const rows = await getGlideRows({
      auth: context.auth,
      tableId,
      limit: context.propsValue.limit ?? 100,
    });

    return flattenGlideRows(rows);
  },
});
