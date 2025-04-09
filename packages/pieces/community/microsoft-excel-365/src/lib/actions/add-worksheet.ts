import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { excelAuth } from '../../index'
import { excelCommon } from '../common/common'

export const addWorksheetAction = createAction({
  auth: excelAuth,
  name: 'add_worksheet',
  description: 'Add a worksheet to a workbook',
  displayName: 'Add a Worksheet to a Workbook',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_name: Property.ShortText({
      displayName: 'Worksheet Name',
      description: 'The name of the new worksheet',
      required: false,
      defaultValue: 'Sheet',
    }),
  },
  async run({ propsValue, auth }) {
    const workbook_id = propsValue['workbook_id']
    const worksheet_name = propsValue['worksheet_name']

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets`,
      body: {
        name: worksheet_name,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    }

    const response = await httpClient.sendRequest(request)

    return response.body
  },
})
