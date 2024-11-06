import { createAction, Property } from '@activepieces/pieces-framework';
import {
  Dimension,
  getHeaders,
  googleSheetsCommon,
  objectToArray,
  objectWithHeadersAsKeysToArray,
  stringifyArray,
  ValueInputOption,
} from '../common/common';
import { googleSheetsAuth } from '../..';
import { isNil } from '@activepieces/shared';

export const insertRowAction = createAction({
  auth: googleSheetsAuth,
  name: 'insert_row',
  description: 'Append a row of values to an existing sheet',
  displayName: 'Insert Row',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    as_string: googleSheetsCommon.as_string,
    first_row_headers: googleSheetsCommon.first_row_headers,
    values: googleSheetsCommon.valuesForOneRow,
    headersAsKeys: googleSheetsCommon.headersAsKeysForInsert,
  },
  async run({ propsValue, auth }) {
    const sheetName = await googleSheetsCommon.findSheetName(
      auth['access_token'],
      propsValue['spreadsheet_id'],
      propsValue['sheet_id']
    );

    const values = propsValue['values'];
    let formattedValues;
    if (propsValue.first_row_headers || propsValue.headersAsKeys) {
      if (propsValue.headersAsKeys) {
        const headers = await getHeaders({
          accessToken: auth['access_token'],
          sheetName: sheetName,
          spreadSheetId: propsValue['spreadsheet_id'],
        });
        formattedValues = await objectWithHeadersAsKeysToArray(headers, values['values']);
      } else {
        formattedValues = objectToArray(values);
      }

      // To prevent undefined values from being completely removed,
      // we have to replace it with empty strings.
      for (let i = 0; i < formattedValues.length; i++) {
        if (isNil(formattedValues[i])) formattedValues[i] = '';
      }
    } else {
      formattedValues = values['values'];
    }

    const res = await googleSheetsCommon.appendGoogleSheetValues({
      accessToken: auth['access_token'],
      majorDimension: Dimension.COLUMNS,
      range: sheetName,
      spreadSheetId: propsValue['spreadsheet_id'],
      valueInputOption: propsValue['as_string']
        ? ValueInputOption.RAW
        : ValueInputOption.USER_ENTERED,
      values: stringifyArray(formattedValues),
    });

    //Split the updatedRange string to extract the row number
    const updatedRangeParts = res.body.updates.updatedRange.split('!');
    const updatedRowRange = updatedRangeParts[1];
    const updatedRowNumber = parseInt(
      updatedRowRange.split(':')[0].substring(1),
      10
    );

    return { ...res.body, row: updatedRowNumber };
  },
});
