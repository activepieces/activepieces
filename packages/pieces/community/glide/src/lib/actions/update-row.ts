import { createAction, Property } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { updateGlideRow } from '../common/client';
import { glideProps } from '../common/props';
import { parseGlideRow, parseRequiredString } from '../common/utils';

export const updateRowAction = createAction({
  auth: glideAuth,
  name: 'update-row',
  displayName: 'Update Row',
  description: 'Update an existing row in a Glide Big Table.',
  props: {
    tableId: glideProps.tableId(),
    rowId: Property.ShortText({
      displayName: 'Row ID',
      description: 'The Glide row ID to update.',
      required: true,
    }),
    row: Property.Json({
      displayName: 'Row',
      description: 'Provide a JSON object containing only the columns you want to update.',
      required: true,
    }),
  },
  async run(context) {
    const tableId = parseRequiredString(context.propsValue.tableId, 'Table');
    const rowId = parseRequiredString(context.propsValue.rowId, 'Row ID');

    await updateGlideRow({
      auth: context.auth,
      tableId,
      rowId,
      row: parseGlideRow(context.propsValue.row),
    });

    return {
      success: true,
      rowId,
    };
  },
});
