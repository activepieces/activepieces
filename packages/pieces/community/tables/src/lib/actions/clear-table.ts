import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const clearTable = createAction({
  name: 'tables-clear-table',
  displayName: 'Clear Table',
  description: 'Delete all records from a table',
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
