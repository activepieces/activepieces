import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpError
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRowAction = createAction({
  auth: excelAuth,
  name: 'getRowById',
  displayName: 'Get Row by ID',
  description: '  Retrieve the entire content of a row by its row ID.',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    table_id: excelCommon.table_id,
    row_id: Property.Number({
      displayName: 'Row ID (Index)',
      description:
        'The zero-based index of the row to retrieve (e.g., 0 for the first row, 1 for the second).',
      required: true
    })
  },
  async run(context) {
    const { workbook_id, table_id, row_id } = context.propsValue;
    const { access_token } = context.auth;

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/rows/itemAt(index=${row_id})`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: access_token
          }
        });
        return response.body;
      } catch (error) {
        const httpError = error as HttpError;
        if (httpError.response?.status === 503 && attempt < maxRetries - 1) {
          const delayMs = 2 ** attempt * 1000;
          console.warn(
            `Excel API is unavailable (503). Retrying after ${delayMs}ms... (Attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await delay(delayMs);
          attempt++;
        } else {
          throw error;
        }
      }
    }
    throw new Error(
      'Failed to retrieve row after multiple retries due to API unavailability.'
    );
  }
});
