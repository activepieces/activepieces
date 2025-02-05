import {
  Property,
  OAuth2PropertyValue,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import { isNil, isString } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleSheetsAuth } from '../../';
import { transformWorkSheetValues } from '../triggers/helpers';

export const googleSheetsCommon = {
  baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
  include_team_drives: Property.Checkbox({
    displayName: 'Include Team Drive Sheets',
    description:
      'Determines if sheets from Team Drives should be included in the results.',
    defaultValue: false,
    required: false,
  }),
  spreadsheet_id: Property.Dropdown({
    displayName: 'Spreadsheet',
    required: true,
    refreshOnSearch: true,
    refreshers: ['include_team_drives'],
    options: async ({ auth, include_team_drives }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const queries = [
        "mimeType='application/vnd.google-apps.spreadsheet'",
        'trashed=false',
      ];
      if (searchValue) {
        queries.push(`name contains '${searchValue}'`);
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const spreadsheets = (
        await httpClient.sendRequest<{ files: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
              q: queries.join(' and '),
              includeItemsFromAllDrives: include_team_drives ? 'true' : 'false',
              supportsAllDrives: 'true',
            },
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token'],
            },
          }
        )
      ).body.files;
      return {
        disabled: false,
        options: spreadsheets.map((sheet: { id: string; name: string }) => {
          return {
            label: sheet.name,
            value: sheet.id,
          };
        }),
      };
    },
  }),
  sheet_id: Property.Dropdown({
    displayName: 'Sheet',
    required: true,
    refreshers: ['spreadsheet_id'],
    options: async ({ auth, spreadsheet_id }) => {
      if (!auth || (spreadsheet_id ?? '').toString().length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a spreadsheet first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const sheets = await listSheetsName(
        authProp['access_token'],
        spreadsheet_id as string
      );
      return {
        disabled: false,
        options: sheets.map(
          (sheet: { properties: { title: string; sheetId: number } }) => {
            return {
              label: sheet.properties.title,
              value: sheet.properties.sheetId,
            };
          }
        ),
      };
    },
  }),
  values: Property.DynamicProperties({
    displayName: 'Values',
    description: 'The values to insert',
    required: true,
    refreshers: ['sheet_id', 'spreadsheet_id', 'first_row_headers'],
    props: async ({ auth, spreadsheet_id, sheet_id, first_row_headers }) => {
      if (
        !auth ||
        (spreadsheet_id ?? '').toString().length === 0 ||
        (sheet_id ?? '').toString().length === 0
      ) {
        return {};
      }
      const sheetId = Number(sheet_id);
      const authentication = auth as OAuth2PropertyValue;
      const headers = await googleSheetsCommon.getHeaderRow({
        spreadsheetId: spreadsheet_id as unknown as string,
        accessToken: getAccessTokenOrThrow(authentication),
        sheetId,
      });

      if (!first_row_headers) {
        return {
          values: Property.Array({
            displayName: 'Values',
            required: true,
          }),
        };
      }
      const firstRow = headers ?? [];
      const properties: {
        [key: string]: any;
      } = {};
      for (let i = 0; i < firstRow.length; i++) {
        const label = columnToLabel(i);
        properties[label] = Property.ShortText({
          displayName: firstRow[i].toString(),
          description: firstRow[i].toString(),
          required: false,
          defaultValue: '',
        });
      }
      return properties;
    },
  }),
  columnName: Property.Dropdown<string>({
    description: 'Column Name',
    displayName: 'The name of the column to search in',
    required: true,
    refreshers: ['sheet_id', 'spreadsheet_id'],
    options: async (context) => {
      const authentication = context.auth as OAuth2PropertyValue;
      const spreadsheet_id = context.spreadsheet_id as string;
      const sheet_id = Number(context.sheet_id) as number;
      const accessToken = authentication['access_token'] ?? '';

      if (
        !context.auth ||
        (spreadsheet_id ?? '').toString().length === 0 ||
        (sheet_id ?? '').toString().length === 0
      ) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a sheet first',
        };
      }

      const sheetName = await googleSheetsCommon.findSheetName(
        accessToken,
        spreadsheet_id,
        sheet_id
      );

      if (!sheetName) {
        throw Error('Sheet not found in spreadsheet');
      }

      const headers = await getHeaderRow({
        spreadsheetId: spreadsheet_id,
        accessToken: accessToken,
        sheetId: sheet_id,
      });

      const ret = [];

      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      if(isNil(headers)) {
        return {
          options: [],
          disabled: false,
        };
      }
      if (headers.length === 0) {
        const columnSize = headers.length;



        for (let i = 0; i < columnSize; i++) {
          ret.push({
            label: alphabet[i].toUpperCase(),
            value: alphabet[i],
          });
        }
      } else {
        let index = 0;
        for (let i = 0; i < headers.length; i++) {
          let value = 'A';
          if (index >= alphabet.length) {
            // if the index is greater than the length of the alphabet, we need to add another letter
            const firstLetter =
              alphabet[Math.floor(index / alphabet.length) - 1];
            const secondLetter = alphabet[index % alphabet.length];
            value = firstLetter + secondLetter;
          } else {
            value = alphabet[index];
          }

          ret.push({
            label: headers[i].toString(),
            value: value,
          });
          index++;
        }
      }
      return {
        options: ret,
        disabled: false,
      };
    },
  }),
  getGoogleSheetRows,
  findSheetName,
  deleteRow,
  clearSheet,
  getHeaderRow,
};


export async function findSheetName(
  access_token: string,
  spreadsheetId: string,
  sheetId: string | number
) {
  const sheets = await listSheetsName(access_token, spreadsheetId);
  // don't use === because sheetId can be a string when dynamic values are used
  const sheetName = sheets.find((f) => f.properties.sheetId == sheetId)
    ?.properties.title;
  if (!sheetName) {
    throw Error(
      `Sheet with ID ${sheetId} not found in spreadsheet ${spreadsheetId}`
    );
  }
  return sheetName;
}


async function listSheetsName(access_token: string, spreadsheet_id: string) {
  return (
    await httpClient.sendRequest<{
      sheets: { properties: { title: string; sheetId: number } }[];
    }>({
      method: HttpMethod.GET,
      url: `https://sheets.googleapis.com/v4/spreadsheets/` + spreadsheet_id,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
    })
  ).body.sheets;
}



type GetGoogleSheetRowsProps = {
  spreadsheetId: string;
  accessToken: string;
  sheetId: number;
  rowIndex_s: number | undefined;
  rowIndex_e: number | undefined;
}

async function getGoogleSheetRows({
  spreadsheetId,
  accessToken,
  sheetId,
  rowIndex_s,
  rowIndex_e,
}: GetGoogleSheetRowsProps): Promise<{ row: number; values: { [x: string]: string } }[]> {
  // Define the API endpoint and headers
  // Send the API request
  const sheetName = await findSheetName(accessToken, spreadsheetId, sheetId);
  if (!sheetName) {
    return [];
  }

  let range = '';
  if (rowIndex_s !== undefined) {
    range = `!A${rowIndex_s}:ZZZ`;
  }
  if (rowIndex_s !== undefined && rowIndex_e !== undefined) {
    range = `!A${rowIndex_s}:ZZZ${rowIndex_e}`;
  }
  const rowsResponse = await httpClient.sendRequest<{ values: [string[]][] }>({
      method: HttpMethod.GET,
      url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${sheetName}${range}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    }
  );
  if (rowsResponse.body.values === undefined) return [];

  const headerResponse = await httpClient.sendRequest<{ values: [string[]][] }>({
    method: HttpMethod.GET,
    url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${sheetName}!A1:ZZZ1`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  const headers = headerResponse.body.values[0]??[];
  const headerCount = headers.length;

  const startingRow = rowIndex_s? rowIndex_s-1:0;

  const labeledRowValues = transformWorkSheetValues(rowsResponse.body.values,startingRow,headerCount);

  return labeledRowValues;
}

type GetHeaderRowProps = {
  spreadsheetId: string;
  accessToken: string;
  sheetId: number;
}

export async function getHeaderRow({
  spreadsheetId,
  accessToken,
  sheetId,
}: GetHeaderRowProps): Promise<string[] | undefined> {
  const rows = await getGoogleSheetRows({
    spreadsheetId,
    accessToken,
    sheetId,
    rowIndex_s: 1,
    rowIndex_e: 1,
  });
  if (rows.length === 0) {
    return undefined;
  }
  return objectToArray(rows[0].values);
}

export const columnToLabel = (columnIndex: number) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let label = '';

  while (columnIndex >= 0) {
    label = alphabet[columnIndex % 26] + label;
    columnIndex = Math.floor(columnIndex / 26) - 1;
  }

  return label;
};
export const labelToColumn = (label: string) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let column = 0;

  for (let i = 0; i < label.length; i++) {
    column +=
      (alphabet.indexOf(label[i]) + 1) * Math.pow(26, label.length - i - 1);
  }

  return column - 1;
};

export function objectToArray(obj: { [x: string]: any }) {
  const maxIndex = Math.max(
    ...Object.keys(obj).map((key) => labelToColumn(key))
  );
  const arr = new Array(maxIndex + 1);
  for (const key in obj) {
    arr[labelToColumn(key)] = obj[key];
  }
  return arr;
}

export function stringifyArray(object: unknown[]): string[] {
  return object.map((val) => {
    if (isString(val)) {
      return val;
    }
    return JSON.stringify(val);
  });
}

async function deleteRow(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  accessToken: string
) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/:batchUpdate`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  };
  await httpClient.sendRequest(request);
}

async function clearSheet(
  spreadsheetId: string,
  sheetId: number,
  accessToken: string,
  rowIndex: number,
  numOfRows: number
) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/:batchUpdate`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + numOfRows + 1,
            },
          },
        },
      ],
    },
  };
  return await httpClient.sendRequest(request);
}

export enum ValueInputOption {
  RAW = 'RAW',
  USER_ENTERED = 'USER_ENTERED',
}

export enum Dimension {
  ROWS = 'ROWS',
  COLUMNS = 'COLUMNS',
}

export async function createGoogleSheetClient(auth: PiecePropValueSchema<typeof googleSheetsAuth>) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const googleSheetClient = google.sheets({ version: 'v4', auth: authClient });
  return googleSheetClient;
}
