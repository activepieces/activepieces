import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common';

export const smartsheetCommon = {
  baseUrl: 'https://api.smartsheet.com/2.0',

  sheet_id: Property.Dropdown({
    displayName: 'Sheet',
    description: 'Select a sheet',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }

      try {
        const sheets = await listSheets(auth as string);
        return {
          options: sheets.map((sheet: SmartsheetSheet) => ({
            value: sheet.id.toString(),
            label: sheet.name,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load sheets',
          options: [],
        };
      }
    },
  }),

  column_id: Property.Dropdown({
    displayName: 'Column',
    description: 'Select a column',
    required: true,
    refreshers: ['sheet_id'],
    options: async ({ auth, sheet_id }) => {
      if (!auth || !sheet_id) {
        return {
          disabled: true,
          placeholder: 'Connect your account and select a sheet first',
          options: [],
        };
      }

      try {
        const columns = await getSheetColumns(auth as string, sheet_id as string);
        return {
          options: columns.map((column: SmartsheetColumn) => ({
            value: column.id.toString(),
            label: column.title,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load columns',
          options: [],
        };
      }
    },
  }),
};

// Interfaces
export interface SmartsheetSheet {
  id: number;
  name: string;
  accessLevel: string;
  permalink: string;
  createdAt: string;
  modifiedAt: string;
}

export interface SmartsheetColumn {
  id: number;
  index: number;
  title: string;
  type: string;
  primary?: boolean;
  options?: string[];
}

export interface SmartsheetRow {
  id: number;
  rowNumber: number;
  siblingId?: number;
  expanded?: boolean;
  createdAt: string;
  modifiedAt: string;
  cells: SmartsheetCell[];
}

export interface SmartsheetCell {
  columnId: number;
  value?: any;
  displayValue?: string;
  formula?: string;
}

export interface SmartsheetAttachment {
  id: number;
  name: string;
  url: string;
  attachmentType: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export interface SmartsheetComment {
  id: number;
  text: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

// Helper functions
export async function listSheets(accessToken: string): Promise<SmartsheetSheet[]> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/sheets`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpClient.sendRequest<{ data: SmartsheetSheet[] }>(request);
  return response.body.data;
}

export async function getSheet(accessToken: string, sheetId: string): Promise<any> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export async function getSheetColumns(accessToken: string, sheetId: string): Promise<SmartsheetColumn[]> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}/columns`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpClient.sendRequest<{ data: SmartsheetColumn[] }>(request);
  return response.body.data;
}

export async function addRowToSmartsheet(
  accessToken: string,
  sheetId: string,
  rowData: any,
  queryParams: any = {}
): Promise<SmartsheetRow> {
  // Build query string from parameters
  const queryString = new URLSearchParams();

  if (queryParams.allowPartialSuccess) {
    queryString.append('allowPartialSuccess', 'true');
  }
  if (queryParams.overrideValidation) {
    queryString.append('overrideValidation', 'true');
  }
  if (queryParams.accessApiLevel) {
    queryString.append('accessApiLevel', queryParams.accessApiLevel.toString());
  }

  const url = `${smartsheetCommon.baseUrl}/sheets/${sheetId}/rows${
    queryString.toString() ? '?' + queryString.toString() : ''
  }`;

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: rowData,
  };

  const response = await httpClient.sendRequest<{ result: SmartsheetRow[] }>(request);
  return response.body.result[0];
}

export async function updateRowInSmartsheet(
  accessToken: string,
  sheetId: string,
  rowData: any,
  queryParams: any = {}
): Promise<SmartsheetRow> {
  // Build query string from parameters
  const queryString = new URLSearchParams();

  if (queryParams.allowPartialSuccess) {
    queryString.append('allowPartialSuccess', 'true');
  }
  if (queryParams.overrideValidation) {
    queryString.append('overrideValidation', 'true');
  }
  if (queryParams.accessApiLevel) {
    queryString.append('accessApiLevel', queryParams.accessApiLevel.toString());
  }

  const url = `${smartsheetCommon.baseUrl}/sheets/${sheetId}/rows${
    queryString.toString() ? '?' + queryString.toString() : ''
  }`;

  const request: HttpRequest = {
    method: HttpMethod.PUT,
    url: url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: rowData,
  };

  const response = await httpClient.sendRequest<{ result: SmartsheetRow[] }>(request);
  return response.body.result[0];
}

export async function getRowAttachments(
  accessToken: string,
  sheetId: string,
  rowId: string
): Promise<SmartsheetAttachment[]> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}/rows/${rowId}/attachments`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpClient.sendRequest<{ data: SmartsheetAttachment[] }>(request);
  return response.body.data || [];
}

export async function findSheetsByName(
  accessToken: string,
  name: string
): Promise<SmartsheetSheet[]> {
  const sheets = await listSheets(accessToken);
  return sheets.filter(sheet =>
    sheet.name.toLowerCase().includes(name.toLowerCase())
  );
}
// Webhook management functions
export interface SmartsheetWebhook {
  id: number;
  name: string;
  callbackUrl: string;
  scope: string;
  scopeObjectId: number;
  events: string[];
  enabled: boolean;
  status: string;
  sharedSecret: string;
}

export async function subscribeWebhook(
  accessToken: string,
  webhookUrl: string,
  sheetId: string,
  webhookName: string
): Promise<SmartsheetWebhook> {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${smartsheetCommon.baseUrl}/webhooks`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: {
      name: webhookName,
      callbackUrl: webhookUrl,
      scope: 'sheet',
      scopeObjectId: parseInt(sheetId),
      events: ['*.*'],
      version: 1,
    },
  };

  const response = await httpClient.sendRequest<{ result: SmartsheetWebhook }>(request);
  return response.body.result;
}

export async function enableWebhook(
  accessToken: string,
  webhookId: string
): Promise<SmartsheetWebhook> {
  const request: HttpRequest = {
    method: HttpMethod.PUT,
    url: `${smartsheetCommon.baseUrl}/webhooks/${webhookId}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: {
      enabled: true,
    },
  };

  const response = await httpClient.sendRequest<{ result: SmartsheetWebhook }>(request);
  return response.body.result;
}

export async function unsubscribeWebhook(
  accessToken: string,
  webhookId: string
): Promise<void> {
  const request: HttpRequest = {
    method: HttpMethod.DELETE,
    url: `${smartsheetCommon.baseUrl}/webhooks/${webhookId}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  await httpClient.sendRequest(request);
}

export async function listWebhooks(
  accessToken: string
): Promise<SmartsheetWebhook[]> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/webhooks`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await httpClient.sendRequest<{ data: SmartsheetWebhook[] }>(request);
  return response.body.data || [];
}


