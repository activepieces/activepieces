import { createAction, Property } from '@activepieces/pieces-framework';
import { Dimension, objectToArray, ValueInputOption } from '../common/common';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';
import { getWorkSheetName } from '../triggers/helpers';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { isString } from '@activepieces/shared';

export const updateRowAction = createAction({
  auth: googleSheetsAuth,
  name: 'update_row',
  description: 'Overwrite values in an existing row',
  displayName: 'Update Row',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    row_id: Property.Number({
      displayName: 'Row Number',
      description: 'The row number to update',
      required: true,
    }),
    first_row_headers: Property.Checkbox({
      displayName: 'Does the first row contain headers?',
      description: 'If the first row is headers',
      required: true,
      defaultValue: false,
    }),
    values: googleSheetsCommon.values,
  },
  async run(context) {
    const spreadSheetId = context.propsValue.spreadsheet_id;
    const sheetId = context.propsValue.sheet_id;
    const rowId = context.propsValue.row_id;
    const idFirstRowHeaders = context.propsValue.first_row_headers;
    const rowValuesInput = context.propsValue.values;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const sheetName = await getWorkSheetName(
      context.auth,
      spreadSheetId,
      sheetId
    );

    // replace empty string with null to skip the cell value
    const formattedValues = (
      idFirstRowHeaders
        ? objectToArray(rowValuesInput)
        : rowValuesInput['values']
    ).map((value: string | null | undefined) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      if (isString(value)) {
        return value;
      }
      return JSON.stringify(value, null, 2);
    });


    if (formattedValues.length > 0) {
      const response = await sheets.spreadsheets.values.update({
        range: `${sheetName}!A${rowId}:ZZZ${rowId}`,
        spreadsheetId: spreadSheetId,
        valueInputOption: ValueInputOption.USER_ENTERED,
        requestBody: {
          values: [formattedValues],
          majorDimension: Dimension.ROWS,
        },
      });

      //Split the updatedRange string to extract the row number
      const updatedRangeParts = response.data.updatedRange?.split(
        '!'
      );
      const updatedRowRange = updatedRangeParts?.[1];
      const updatedRowNumber = parseInt(
        updatedRowRange?.split(':')[0].substring(1) ?? '0',
        10
      );

      return { updates: { ...response.data }, row: updatedRowNumber };
    } else {
      throw Error(
        'Values passed are empty or not array ' +
        JSON.stringify(formattedValues)
      );
    }
  },
});
