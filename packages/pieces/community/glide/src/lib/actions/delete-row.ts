import { createAction, Property } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { deleteGlideRow } from '../common/client';
import { glideProps } from '../common/props';
import { parseRequiredString } from '../common/utils';

export const deleteRowAction = createAction({
  auth: glideAuth,
  name: 'delete-row',
  displayName: 'Delete Row',
  description: 'Delete a row from a Glide Big Table.',
  props: {
    tableId: glideProps.tableId(),
    rowId: Property.ShortText({
      displayName: 'Row ID',
      description: 'The Glide row ID to delete.',
      required: true,
    }),
  },
  async run(context) {
    const tableId = parseRequiredString(context.propsValue.tableId, 'Table');
    const rowId = parseRequiredString(context.propsValue.rowId, 'Row ID');

    await deleteGlideRow({
      auth: context.auth,
      tableId,
      rowId,
    });

    return {
      success: true,
      rowId,
    };
  },
});
