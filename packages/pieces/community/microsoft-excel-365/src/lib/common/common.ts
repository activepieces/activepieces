import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const excelCommon = {
  baseUrl: 'https://graph.microsoft.com/v1.0/me/drive',
  workbook_id: Property.Dropdown({
    displayName: 'Workbook',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first'
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const workbooks: { id: string; name: string }[] = (
        await httpClient.sendRequest<{ value: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/root/search(q='.xlsx')?$select=id,name`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token']
            }
          }
        )
      ).body.value;
      return {
        disabled: false,
        options: workbooks.map((workbook: { id: string; name: string }) => {
          return {
            label: workbook.name,
            value: workbook.id
          };
        })
      };
    },
    refreshers: []
  }),
  worksheet_id: Property.Dropdown({
    displayName: 'Worksheet',
    required: true,
    refreshers: ['workbook_id'],
    options: async ({ auth, workbook_id }) => {
      if (!auth || !workbook_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workbook first'
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const worksheets: { id: string; name: string }[] = (
        await httpClient.sendRequest<{ value: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets?$select=id,name`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token']
            }
          }
        )
      ).body.value;

      return {
        disabled: false,
        options: worksheets.map((worksheet: { id: string; name: string }) => {
          return {
            label: worksheet.name,
            value: worksheet.name
          };
        })
      };
    }
  }),
  table_id: Property.Dropdown({
    displayName: 'Table',
    required: true,
    refreshers: ['workbook_id', 'worksheet_id'],
    options: async ({ auth, workbook_id, worksheet_id }) => {
      if (!auth || !workbook_id || !worksheet_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workbook and worksheet first'
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const tables: { id: string; name: string }[] = (
        await httpClient.sendRequest<{ value: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/tables`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token']
            }
          }
        )
      ).body.value;

      return {
        disabled: false,
        options: tables.map((table: { id: string; name: string }) => {
          return {
            label: table.name,
            value: table.id
          };
        })
      };
    }
  }),
  values: Property.DynamicProperties({
    displayName: 'Values',
    description: 'The values to insert',
    required: true,
    refreshers: ['workbook_id', 'worksheet_id', 'first_row_headers'],
    props: async ({ auth, workbook_id, worksheet_id, first_row_headers }) => {
      if (
        !auth ||
        (workbook_id ?? '').toString().length === 0 ||
        (worksheet_id ?? '').toString().length === 0
      ) {
        return {};
      }

      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;

      if (!first_row_headers) {
        return {
          values: Property.Array({
            displayName: 'Values',
            required: true
          })
        };
      }
      const firstRow = await excelCommon.getHeaders(
        workbook_id as unknown as string,
        authProp['access_token'],
        worksheet_id as unknown as string
      );

      const properties: {
        [key: string]: any;
      } = {};
      for (const key in firstRow) {
        properties[key] = Property.ShortText({
          displayName: firstRow[key].toString(),
          description: firstRow[key].toString(),
          required: false,
          defaultValue: ''
        });
      }
      return properties;
    }
  }),
  table_values: Property.DynamicProperties({
    displayName: 'Values',
    description: 'The values to insert',
    required: true,
    refreshers: ['workbook_id', 'worksheet_id', 'table_id'],
    props: async ({ auth, workbook_id, worksheet_id, table_id }) => {
      if (
        !auth ||
        (workbook_id ?? '').toString().length === 0 ||
        (worksheet_id ?? '').toString().length === 0 ||
        (worksheet_id ?? '').toString().length === 0
      ) {
        return {};
      }

      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;

      const headers = await excelCommon.getTableHeaders(
        workbook_id as unknown as string,
        authProp['access_token'],
        worksheet_id as unknown as string,
        table_id as unknown as string
      );

      const properties: {
        [key: string]: any;
      } = {};
      for (const key in headers) {
        properties[key] = Property.ShortText({
          displayName: headers[key].toString(),
          description: headers[key].toString(),
          required: false,
          defaultValue: ''
        });
      }
      return properties;
    }
  }),
  parent_folder: Property.Dropdown({
    displayName: 'Parent Folder',
    description: 'The parent folder to use',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first'
        };
      }

      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;

      const rootFolderId = 'root';
      const allFolders: { id: string; name: string }[] =
        await excelCommon.getAllFolders(
          rootFolderId,
          authProp['access_token'],
          ''
        );
      allFolders.unshift({
        id: rootFolderId,
        name: '/'
      });

      return {
        disabled: false,
        options: allFolders.map((table: { id: string; name: string }) => {
          return {
            label: table.name,
            value: table.id
          };
        })
      };
    }
  }),
  getHeaders: async function (
    workbookId: string,
    accessToken: string,
    worksheetId: string
  ) {
    const response = await httpClient.sendRequest<{
      values: (string | number | boolean)[][];
    }>({
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange(valuesOnly=true)`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken
      }
    });

    return response.body.values?.[0] ?? [];
  },
  getTableHeaders: async function (
    workbookId: string,
    accessToken: string,
    worksheetId: string,
    tableId: string
  ) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/columns`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken
      }
    });

    const columnNames = response.body['value'].map(
      (column: { name: any }) => column.name
    );
    return columnNames;
  },
  getLastUsedRow: async function (
    workbookId: string,
    worksheetId: string,
    accessToken: string
  ): Promise<number> {
    const url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken
      }
    };

    const response = await httpClient.sendRequest(request);
    const usedRange = response.body['address'].split('!')[1];
    const [, lastCell] = usedRange.split(':');
    const lastRow = parseInt(lastCell.match(/\d+/)[0], 10);

    return lastRow;
  },
  getLastUsedColumn: async function (
    workbookId: string,
    worksheetId: string,
    accessToken: string
  ): Promise<string> {
    const url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken
      }
    };

    const response = await httpClient.sendRequest(request);
    const usedRange = response.body['address'].split('!')[1];
    const [, lastCell] = usedRange.split(':');
    const lastColumnLetter = lastCell.match(/[A-Z]+/)[0];

    return lastColumnLetter;
  },
  getAllRows: async function (
    workbookId: string,
    worksheetId: string,
    accessToken: string
  ): Promise<(string | number | boolean)[][]> {
    const response = await httpClient.sendRequest<{
      values: (string | number | boolean)[][];
    }>({
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange(valuesOnly=true)`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken
      }
    });

    return response.body['values'] ?? [];
  },
  numberToColumnName: function (num: number): string {
    let columnName = '';
    while (num > 0) {
      const modulo = (num - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      num = Math.floor((num - modulo) / 26);
    }
    return columnName;
  },
  getAllFolders: async function (
    folderId: string,
    authToken: string,
    currentPath: string
  ): Promise<{ id: string; name: string }[]> {
    const apiUrl = `${excelCommon.baseUrl}/items/${folderId}/children?$filter=folder ne null`;
    const response = await httpClient.sendRequest<{
      value: { id: string; name: string; folder?: unknown }[];
    }>({
      url: apiUrl,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authToken
      }
    });

    if (!response.body || !response.body.value) {
      return [];
    }

    const folders = response.body.value.map((folder) => ({
      id: `${folder.id}`,
      name: `${currentPath}/${folder.name}`
    }));
    let allSubFolders: { id: string; name: string }[] = [...folders];

    for (const folder of folders) {
      const subFolders = await excelCommon.getAllFolders(
        folder.id,
        authToken,
        folder.name
      );
      allSubFolders = allSubFolders.concat(subFolders);
    }
    return allSubFolders;
  }
};

export function objectToArray(obj: { [x: string]: any }) {
  const maxIndex = Math.max(...Object.keys(obj).map(Number));
  const arr = new Array(maxIndex + 1).fill(null);
  for (const key in obj) {
    arr[Number(key)] = obj[key];
  }
  return arr;
}
