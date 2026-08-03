import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PopulatedRecord } from '@activepieces/pieces-framework';

export const getRecord = createAction({
  audience: 'both',
  name: 'tables-get-record',
  displayName: 'Get Record',
  description: 'Get single record by its id.',
  aiMetadata: { description: 'Fetches one Activepieces Table record by its record ID and returns its cell values. Pick this when the exact record ID is already in hand, for example from a table trigger payload or an earlier Find Records step; use Find Records to look rows up by column value instead. Requires both the table ID and the record ID, and cannot search by column content; read-only and idempotent.', idempotent: true },
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    record_id: tablesCommon.record_id,
  },
  async run(context) {
    const { record_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/records/${record_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    return tablesCommon.formatRecord(response.body as PopulatedRecord);
  },
});
