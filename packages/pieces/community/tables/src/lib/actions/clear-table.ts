import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ClearTableResponse } from '@activepieces/shared';

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

    const response = await httpClient.sendRequest<ClearTableResponse>({
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
      deletedCount: response.body.deletedCount,
    };
  },
});
