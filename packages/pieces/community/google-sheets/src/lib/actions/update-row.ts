import { createAction, Property } from '@activepieces/pieces-framework';
import {
  objectToArray,
  stringifyArray,
  ValueInputOption,
} from '../common/common';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

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
  async run({ propsValue, auth }) {
    const { spreadsheet_id, sheet_id, values, row_id, first_row_headers } =
      propsValue;
    const sheetName = await googleSheetsCommon.findSheetName(
      auth['access_token'],
      spreadsheet_id,
      sheet_id
    );

    let formattedValues = (
      first_row_headers ? objectToArray(values) : values['values']
    ) as (string | null)[];
    formattedValues = formattedValues.map((value) =>
      value === '' ? null : value
    );
    if (formattedValues.length > 0) {
      const res = await googleSheetsCommon.updateGoogleSheetRow({
        accessToken: auth['access_token'],
        rowIndex: Number(row_id),
        sheetName: sheetName,
        spreadSheetId: spreadsheet_id,
        valueInputOption: ValueInputOption.USER_ENTERED,
        values: stringifyArray(formattedValues),
      });

      //Split the updatedRange string to extract the row number
      const updatedRangeParts = res.body.updatedRange.split('!');
      const updatedRowRange = updatedRangeParts[1];
      const updatedRowNumber = parseInt(
        updatedRowRange.split(':')[0].substring(1),
        10
      );

      return { updates: { ...res.body }, row: updatedRowNumber };
    } else {
      throw Error(
        'Values passed are empty or not array ' +
          JSON.stringify(formattedValues)
      );
    }
  },
});
