import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';

export const deleteTable = createAction({
  audience: 'human',
  name: 'tables-delete-table',
  displayName: 'Delete Table',
  description: 'Delete a table and all of its records.',
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
