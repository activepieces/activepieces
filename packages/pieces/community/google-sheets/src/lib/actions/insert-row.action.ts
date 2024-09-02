import { createAction, Property } from '@activepieces/pieces-framework';
import {
  Dimension,
  googleSheetsCommon,
  objectToArray,
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
    as_string: Property.Checkbox({
      displayName: 'As String',
      description:
        'Inserted values that are dates and formulas will be entered strings and have no effect',
      required: false,
    }),
    first_row_headers: Property.Checkbox({
      displayName: 'Does the first row contain headers?',
      description: 'If the first row is headers',
      required: true,
      defaultValue: false,
    }),
    values: googleSheetsCommon.values,
  },
  async run({ propsValue, auth }) {
    const values = propsValue['values'];
    const sheetName = await googleSheetsCommon.findSheetName(
      auth['access_token'],
      propsValue['spreadsheet_id'],
      propsValue['sheet_id']
    );
    let formattedValues;
    if (propsValue.first_row_headers) {
      formattedValues = objectToArray(values);
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
