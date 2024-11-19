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
import { isString } from '@activepieces/shared';
import { google, sheets_v4, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleSheetsAuth } from '../../';

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
      const values = await googleSheetsCommon.getValues(
        spreadsheet_id as unknown as string,
        getAccessTokenOrThrow(authentication),
        sheetId
      );

      if (!first_row_headers) {
        return {
          values: Property.Array({
            displayName: 'Values',
            required: true,
          }),
        };
      }
      const firstRow = values?.[0]?.values ?? [];
      const properties: {
        [key: string]: any;
      } = {};
      for (const key in firstRow) {
        properties[key] = Property.ShortText({
          displayName: firstRow[key].toString(),
          description: firstRow[key].toString(),
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

      const values: {
        row: number;
        values: {
          [x: string]: string[];
        }[];
      }[] = await googleSheetsCommon.getValues(
        spreadsheet_id,
        accessToken,
        sheet_id
      );

      const ret = [];

      const firstRow = values[0].values;
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      if (firstRow.length === 0) {
        let columnSize = 1;

        for (const row of values) {
          columnSize = Math.max(columnSize, row.values.length);
        }

        for (let i = 0; i < columnSize; i++) {
          ret.push({
            label: alphabet[i].toUpperCase(),
            value: alphabet[i],
          });
        }
      } else {
        let index = 0;
        for (const key in firstRow) {
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
            label: firstRow[key].toString(),
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
  getValues: getValues,
  appendGoogleSheetValues: appendGoogleSheetValues,
  updateGoogleSheetRow: updateGoogleSheetRow,
  findSheetName: findSheetName,
  deleteRow: deleteRow,
  clearSheet: clearSheet,
};

type UpdateGoogleSheetRowParams = {
  values: string[];
  spreadSheetId: string;
  valueInputOption: ValueInputOption;
  rowIndex: number;
  accessToken: string;
  sheetName: string;
};

type AppendGoogleSheetValuesParams = {
  values: string[];
  spreadSheetId: string;
  range: string;
  valueInputOption: ValueInputOption;
  majorDimension: Dimension;
  accessToken: string;
};

export async function findSheetName(
  access_token: string,
  spreadsheetId: string,
  sheetId: number
) {
  const sheets = await listSheetsName(access_token, spreadsheetId);
  const sheetName = sheets.find((f) => f.properties.sheetId === sheetId)
    ?.properties.title;
  if (!sheetName) {
    throw Error(
      `Sheet with ID ${sheetId} not found in spreadsheet ${spreadsheetId}`
    );
  }
  return sheetName;
}

export async function getGoogleSheetRows(params: {
  accessToken: string;
  sheetName: string;
  spreadSheetId: string;
  rowIndex_s: number;
  rowIndex_e: number;
}) {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleSheetsCommon.baseUrl}/${params.spreadSheetId}/values/${params.sheetName}!A${params.rowIndex_s}:ZZZ${params.rowIndex_e}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.accessToken,
    },
  };
  const response = await httpClient.sendRequest<{ values: [string[]][] }>(
    request
  );
  if (response.body.values === undefined) return [];

  const res = [];
  for (let i = 0; i < response.body.values.length; i++) {
    const values: any = {};
    for (let j = 0; j < response.body.values[i].length; j++) {
      values[columnToLabel(j)] = response.body.values[i][j];
    }

    res.push({
      row: i + params.rowIndex_s,
      values,
    });
  }

  return res;
}
export async function getAllGoogleSheetRows(params: {
  accessToken: string;
  sheetName: string;
  spreadSheetId: string;
}) {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleSheetsCommon.baseUrl}/${params.spreadSheetId}/values/${params.sheetName}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.accessToken,
    },
  };
  const response = await httpClient.sendRequest<{ values: [string[]][] }>(
    request
  );
  if (response.body.values === undefined) return [];

  const res = [];
  for (let i = 0; i < response.body.values.length; i++) {
    const values: any = {};
    for (let j = 0; j < response.body.values[i].length; j++) {
      values[columnToLabel(j)] = response.body.values[i][j];
    }

    res.push({
      row: i + 1,
      values,
    });
  }

  return res;
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

async function updateGoogleSheetRow(params: UpdateGoogleSheetRowParams) {
  return httpClient.sendRequest({
    method: HttpMethod.PUT,
    url: `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadSheetId}/values/${params.sheetName}!A${params.rowIndex}:ZZZ${params.rowIndex}`,
    body: {
      majorDimension: Dimension.ROWS,
      range: `${params.sheetName}!A${params.rowIndex}:ZZZ${params.rowIndex}`,
      values: [params.values],
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.accessToken,
    },
    queryParams: {
      valueInputOption: params.valueInputOption,
    },
  });
}

async function appendGoogleSheetValues(params: AppendGoogleSheetValuesParams) {
  const requestBody = {
    majorDimension: params.majorDimension,
    range: params.range + '!A:A',
    values: params.values.map((val) => ({ values: val })),
  };

  const request: HttpRequest<typeof requestBody> = {
    method: HttpMethod.POST,
    url: `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadSheetId}/values/${params.range}!A:A:append`,
    body: requestBody,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.accessToken,
    },
    queryParams: {
      valueInputOption: params.valueInputOption,
    },
  };
  return httpClient.sendRequest(request);
}

async function getValues(
  spreadsheetId: string,
  accessToken: string,
  sheetId: number
): Promise<{ row: number; values: { [x: string]: string[] }[] }[]> {
  // Define the API endpoint and headers
  // Send the API request
  const sheetName = await findSheetName(accessToken, spreadsheetId, sheetId);
  if (!sheetName) {
    return [];
  }
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${sheetName}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  };
  const response = await httpClient.sendRequest<{ values: [string[]][] }>(
    request
  );
  if (response.body.values === undefined) return [];

  const res = [];
  for (let i = 0; i < response.body.values.length; i++) {
    const values: any = {};
    for (let j = 0; j < response.body.values[i].length; j++) {
      values[columnToLabel(j)] = response.body.values[i][j];
    }

    res.push({
      row: i + 1,
      values,
    });
  }

  return res;
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

export async function copyFile(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  title: string,
  fileId?: string
) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const drive = google.drive({ version: 'v3', auth: authClient });

  return await drive.files.copy({
    fileId,
    fields: '*',
    supportsAllDrives: true,
    requestBody: {
      name: title,
    },
  });
}

export async function moveFile(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  fileId: string,
  folderId: string
) {
  const response = await httpClient.sendRequest<drive_v3.Schema$File>({
    method: HttpMethod.PUT,
    url: `https://www.googleapis.com/drive/v2/files/${fileId}`,
    queryParams: {
      addParents: folderId,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return response.body;
}

export async function createSpreadsheet(
  auth: PiecePropValueSchema<typeof googleSheetsAuth>,
  title: string
) {
  const response = await httpClient.sendRequest<sheets_v4.Schema$Spreadsheet>({
    method: HttpMethod.POST,
    url: 'https://sheets.googleapis.com/v4/spreadsheets',
    body: {
      properties: {
        title,
      },
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return response.body;
}
