import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

const namingRules = `
The new name for the worksheet. The name must adhere to the following rules:
- Cannot be blank.
- Cannot exceed 31 characters.
- Must not contain any of the following characters: \`/\`, \`\\\`, \`?\`, \`*\`, \`:\`, \`[\`, \`]\`.
- The name "History" is reserved by Excel and cannot be used.
`;

export const renameWorksheetAction = createAction({
  auth: excelAuth,
  name: 'rename_worksheet',
  displayName: 'Rename Worksheet',
  description: 'Change the name of an existing worksheet.',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    new_name: Property.ShortText({
      displayName: 'New Worksheet Name',
      description: namingRules,
      required: true
    })
  },
  async run(context) {
    const { workbook_id, worksheet_id, new_name } = context.propsValue;
    const { access_token } = context.auth;

    // The worksheet_id prop from excelCommon returns the worksheet's current name,
    // which can be used to identify it in the API URL.
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      },
      body: {
        name: new_name
      }
    });

    return response.body;
  }
});
