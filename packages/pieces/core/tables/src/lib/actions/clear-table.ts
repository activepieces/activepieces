import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const clearTable = createAction({
  audience: 'both',
  name: 'tables-clear-table',
  displayName: 'Clear Table',
  description: 'Delete all records from a table',
  aiMetadata: { description: 'Removes every record from an Activepieces Table while leaving the table and its field/column definitions intact. Pick this to empty a table before reloading it; use Delete Record(s) to remove specific rows by ID, or Delete Table to drop the table itself. Requires the table ID and deletes all rows with no filter or confirmation step; idempotent, since the table ends up empty no matter how many times it runs.', idempotent: true },
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
  },
  async run(context) {
    const { table_id: tableExternalId } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/tables/${tableId}/clear`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    return {
      success: true,
    };
  },
});
