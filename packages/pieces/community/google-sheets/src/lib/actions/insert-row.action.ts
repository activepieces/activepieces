import { createAction, Property } from '@activepieces/pieces-framework';
import {
  areSheetIdsValid,
  Dimension,
  googleSheetsCommon,
  objectToArray,
  stringifyArray,
  ValueInputOption,
} from '../common/common';
import { googleSheetsAuth } from '../..';
import { isNil } from '@activepieces/shared';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { commonProps, rowValuesProp } from '../common/props';

export const insertRowAction = createAction({
  auth: googleSheetsAuth,
  name: 'insert_row',
  description: 'Append a row of values to an existing sheet',
  displayName: 'Insert Row',
  props: {
    ...commonProps,
    as_string: Property.Checkbox({
      displayName: 'As String',
      description: 'Inserted values that are dates and formulas will be entered strings and have no effect',
      required: false,
    }),
    first_row_headers: Property.Checkbox({
      displayName: 'Does the first row contain headers?',
      description: 'If the first row is headers',
      required: true,
      defaultValue: false,
    }),
    values: rowValuesProp(),
  },
  async run({ propsValue, auth }) {
    const { values, spreadsheetId:inputSpreadsheetId, sheetId:inputSheetId, as_string, first_row_headers } = propsValue;
    const accessToken = auth.access_token;

    if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

    const sheetName = await googleSheetsCommon.findSheetName(
      accessToken,
      spreadsheetId,
      sheetId
    );

    const formattedValues = first_row_headers
      ? objectToArray(values).map(val => isNil(val) ? '' : val)
      : values.values;

    const res = await appendGoogleSheetValues({
      accessToken,
      majorDimension: Dimension.COLUMNS,
      range: sheetName,
      spreadSheetId: spreadsheetId,
      valueInputOption: as_string ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED,
      values: stringifyArray(formattedValues),
    });

    const updatedRowNumber = extractRowNumber(res.body.updates.updatedRange);
    return { ...res.body, row: updatedRowNumber };
  },
});

function extractRowNumber(updatedRange: string): number {
  const rowRange = updatedRange.split('!')[1];
  return parseInt(rowRange.split(':')[0].substring(1), 10);
}

async function appendGoogleSheetValues(params: AppendGoogleSheetValuesParams) {
  const { accessToken, majorDimension, range, spreadSheetId, valueInputOption, values } = params;

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${encodeURIComponent(`${range}!A:A`)}:append`,
    body: {
      majorDimension,
      range: `${range}!A:A`,
      values: values.map(val => ({ values: val })),
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    queryParams: {
      valueInputOption,
    },
  };

  return httpClient.sendRequest(request);
}

type AppendGoogleSheetValuesParams = {
  values: string[];
  spreadSheetId: string;
  range: string;
  valueInputOption: ValueInputOption;
  majorDimension: Dimension;
  accessToken: string;
};
