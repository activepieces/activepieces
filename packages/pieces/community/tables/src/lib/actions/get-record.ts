import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getRecord = createAction({
  name: 'tables-get-record',
  displayName: 'Get Record',
  description: 'Get single record by its id.',
  auth: PieceAuth.None(),
  props: {
    table_name: tablesCommon.table_name,
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to get.',
      required: true,
    }),
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
    });

    return response.body;
  },
});
