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
  audience: 'both',
  aiMetadata: {
    description: 'Permanently remove a single row from a Glide Big Table, targeted by table ID and the specific row ID. Requires a known row ID (look one up first via Get Rows if needed). Idempotent on a stable row ID — the end state is the row no longer existing, and re-running has no further effect.',
    idempotent: true,
  },
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
