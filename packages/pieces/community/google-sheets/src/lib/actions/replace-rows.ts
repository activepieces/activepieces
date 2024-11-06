import { googleSheetsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    Dimension,
    getHeaders,
    googleSheetsCommon,
    objectToArray,
    objectWithHeadersAsKeysToArray,
    ValueInputOption,
} from '../common/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const replaceRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'replace_rows',
  displayName: 'Replace all rows',
  description: 'Replace all the data rows with the provided list',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    as_string: googleSheetsCommon.as_string,
    first_row_headers: googleSheetsCommon.first_row_headers,
    values: googleSheetsCommon.valuesForMultipleRows,
    headersAsKeys: googleSheetsCommon.headersAsKeysForInsert,
  },

  async run(context) {
    const spreadSheetId = context.propsValue.spreadsheet_id;
    const sheetId = context.propsValue.sheet_id;
    const accessToken = context.auth['access_token'] ?? '';

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    const sheets = (await sheetsClient.spreadsheets.get({ spreadsheetId: spreadSheetId })).data.sheets;
    const sheet = sheets?.find((f) => f.properties?.sheetId == sheetId);
    const currentRows = sheet?.properties?.gridProperties?.rowCount;
    const sheetName = sheet?.properties?.title;
    if (!currentRows || !sheetName) {
      throw Error(`Sheet with ID ${sheetId} not found in spreadsheet ${spreadSheetId}`);
    }

    const headers = context.propsValue.headersAsKeys
      ? await getHeaders({ accessToken, sheetName, spreadSheetId })
      : [];

    const formattedValues = [];
    for (const rowInput of context.propsValue.values['values']) {
      formattedValues.push(
        context.propsValue.headersAsKeys
          ? await objectWithHeadersAsKeysToArray(headers, rowInput)
          : objectToArray(rowInput)
      );
    }

    const headerRows = context.propsValue.first_row_headers ? 1 : 0;
    const requiredRows = formattedValues.length + headerRows;

    if (requiredRows > currentRows) {
      // Add the required rows to match the size of the data that will be inserted
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: spreadSheetId,
        requestBody: {
          requests: [
            {
              insertDimension: {
                inheritFromBefore: true,
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: currentRows,
                  endIndex: requiredRows,
                },
              },
            }
          ],
        }
      });
    } else if (requiredRows < currentRows) {
      // Remove existing rows to match the size of the data that will be inserted
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: spreadSheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: requiredRows,
                },
              },
            }
          ],
        }
      });
    }

    // Put the data into the cells, replacing both existing data and empty cells
    return await sheetsClient.spreadsheets.values.update({
      range: sheetName + `!A${headerRows + 1}`,
      spreadsheetId: spreadSheetId,
      valueInputOption: context.propsValue.as_string
        ? ValueInputOption.RAW
        : ValueInputOption.USER_ENTERED,
      requestBody: {
        values: formattedValues,
        majorDimension: Dimension.ROWS,
      },
    });
  },
});
