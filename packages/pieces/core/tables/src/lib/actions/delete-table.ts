import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';

export const deleteTable = createAction({
  audience: 'both',
  name: 'tables-delete-table',
  displayName: 'Delete Table',
  description: 'Delete a table and all of its records.',
  aiMetadata: { description: 'Permanently drops an Activepieces Table together with all of its records and column definitions. Pick this only when the table itself should cease to exist; use Clear Table to wipe the rows but keep the schema, or Delete Record(s) to remove individual rows. Requires the table ID and is irreversible, with no confirmation prompt or recovery path; idempotent, since the table ends up gone regardless of how many times it runs.', idempotent: true },
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
  },
  async run(context) {
    const { table_id } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(table_id, context);

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${context.server.apiUrl}v1/tables/${tableId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return { success: true };
  },
});
