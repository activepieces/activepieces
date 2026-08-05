import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteRecord = createAction({
  audience: 'both',
  name: 'tables-delete-record',
  displayName: 'Delete Record(s)',
  description: 'Delete record(s) from a table',
  aiMetadata: { description: 'Deletes one or more rows from an Activepieces Table by record ID, accepting a list of IDs in a single call. Pick this to remove specific known rows; use Clear Table to empty a table wholesale, or Delete Table to drop the table along with its schema. Requires the table ID plus the record IDs, which come from Find Records or a table trigger payload, and cannot delete by filter or field value; idempotent.', idempotent: true },
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    records_ids:  Property.Array({
      displayName: 'Records IDs',
      required: true,
      description: 'The IDs of the records to delete'
    }),
  },
  async run(context) {
    const { records_ids, table_id } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(table_id, context);

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${context.server.apiUrl}v1/records/`,
      body: {
        tableId,
        ids: records_ids,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    return {
      success: true
    };
  },
});
