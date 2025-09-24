import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteRecord = createAction({
  name: 'tables-delete-record',
  displayName: 'Delete Record(s)',
  description: 'Delete record(s) from a table',
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
    const { records_ids } = context.propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${context.server.apiUrl}v1/records/`,
      body: {
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
