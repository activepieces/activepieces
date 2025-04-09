import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { PieceAuth, Property, createAction } from '@activepieces/pieces-framework'
import { PopulatedRecord } from '@activepieces/shared'
import { tablesCommon } from '../common'

export const getRecord = createAction({
  name: 'tables-get-record',
  displayName: 'Get Record',
  description: 'Get single record by its id.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    record_id: tablesCommon.record_id,
  },
  async run(context) {
    const { record_id } = context.propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/records/${record_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    })

    return tablesCommon.formatRecord(response.body as PopulatedRecord)
  },
})
