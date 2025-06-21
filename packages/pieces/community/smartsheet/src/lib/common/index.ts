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
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      try {
        const sheets = await listSheets(auth as string);

        if (sheets.length === 0) {
          return {
            disabled: true,
            placeholder: '📂 No sheets found in your account',
            options: [],
          };
        }

        return {
          options: sheets.map((sheet: SmartsheetSheet) => ({
            value: sheet.id.toString(),
            label: sheet.name,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load sheets - check your connection',
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
      if (!auth) {
        return {
          disabled: true,
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      if (!sheet_id) {
        return {
          disabled: true,
          placeholder: '📋 Please select a sheet first',
          options: [],
        };
      }

      try {
        const columns = await getSheetColumns(auth as unknown as string, sheet_id as unknown as string);

        if (columns.length === 0) {
          return {
            disabled: true,
            placeholder: '📄 No columns found in this sheet',
            options: [],
          };
        }

        return {
          options: columns.map((column: SmartsheetColumn) => ({
            value: column.id.toString(),
            label: column.title,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load columns - check your permissions',
          options: [],
        };
      }
    },
  }),

  // Dynamic cell properties based on column types
  cells: Property.DynamicProperties({
    displayName: 'Cells',
    description: 'Cell data with properties based on column types',
    required: true,
    refreshers: ['sheet_id'],
    props: async ({ auth, sheet_id }) => {
      if (!auth) {
        return {
          auth_required: Property.MarkDown({
            value: '⚠️ **Please authenticate first**\n\nConnect your Smartsheet account to load column-based cell properties.',
          }),
        };
      }

      if (!sheet_id) {
        return {
          sheet_required: Property.MarkDown({
            value: '📋 **Please select a sheet first**\n\nChoose a sheet from the dropdown above to load its columns and configure cell properties.',
          }),
        };
      }

      const fields: Record<string, any> = {};

      try {
        const columns = await getSheetColumns(auth as unknown as string, sheet_id as unknown as string);

        if (columns.length === 0) {
          return {
            no_columns: Property.MarkDown({
              value: '📝 **No columns found**\n\nThis sheet appears to have no columns. Please check if the sheet exists and you have access to it.',
            }),
          };
        }

        for (const column of columns) {
          const baseProps = {
            displayName: column.title,
            required: false,
          };

          // Create cell properties based on column type
          switch (column.type?.toLowerCase()) {
            case 'text_number':
            case 'text':
              fields[`column_${column.id}`] = Property.ShortText({
                ...baseProps,
                description: `Text value for ${column.title}`,
              });
              break;

            case 'date':
            case 'datetime':
              fields[`column_${column.id}`] = Property.DateTime({
                ...baseProps,
                description: `Date/time value for ${column.title}`,
              });
              break;

            case 'checkbox':
              fields[`column_${column.id}`] = Property.Checkbox({
                ...baseProps,
                description: `Checkbox value for ${column.title}`,
              });
              break;

            case 'picklist':
            case 'multi_picklist':
              if (column.options && column.options.length > 0) {
                const dropdownOptions = column.options.map(option => ({
                  label: option,
                  value: option,
                }));

                if (column.type?.toLowerCase() === 'multi_picklist') {
                  fields[`column_${column.id}`] = Property.StaticMultiSelectDropdown({
                    ...baseProps,
                    description: `Multiple selection for ${column.title}`,
                    options: {
                      options: dropdownOptions,
                    },
                  });
                } else {
                  fields[`column_${column.id}`] = Property.StaticDropdown({
                    ...baseProps,
                    description: `Select option for ${column.title}`,
                    options: {
                      options: dropdownOptions,
                    },
                  });
                }
              } else {
                fields[`column_${column.id}`] = Property.ShortText({
                  ...baseProps,
                  description: `Value for ${column.title}`,
                });
              }
              break;

            case 'contact_list':
            case 'multi_contact_list':
              fields[`column_${column.id}`] = Property.ShortText({
                ...baseProps,
                description: `Contact email(s) for ${column.title}. For multiple contacts, separate with commas.`,
              });
              break;

            case 'duration':
              fields[`column_${column.id}`] = Property.Number({
                ...baseProps,
                description: `Duration in days for ${column.title}`,
              });
              break;

            case 'predecessor':
              fields[`column_${column.id}`] = Property.ShortText({
                ...baseProps,
                description: `Predecessor row numbers for ${column.title}. Format: "1FS+2d,3SS" etc.`,
              });
              break;

            case 'abstract_datetime':
              fields[`column_${column.id}`] = Property.DateTime({
                ...baseProps,
                description: `Date/time value for ${column.title}`,
              });
              break;

            case 'auto_number':
              // Auto number columns are read-only, so we skip them
              continue;

            case 'symbol':
              fields[`column_${column.id}`] = Property.ShortText({
                ...baseProps,
                description: `Symbol value for ${column.title}. Use symbols like FLAG, STAR, etc.`,
              });
              break;

            default:
              // For unknown column types, provide a generic text input
              fields[`column_${column.id}`] = Property.ShortText({
                ...baseProps,
                description: `Value for ${column.title} (${column.type || 'unknown type'})`,
              });
              break;
          }

          // Add formula option for all column types except certain system columns
          if (!column.primary && column.type?.toLowerCase() !== 'auto_number') {
            fields[`formula_${column.id}`] = Property.ShortText({
              displayName: `${column.title} (Formula)`,
              description: `Formula for ${column.title}. Use either value or formula, not both.`,
              required: false,
            });
          }

          // Add hyperlink options for text columns
          if (['text_number', 'text'].includes(column.type?.toLowerCase() || '')) {
            fields[`hyperlink_url_${column.id}`] = Property.ShortText({
              displayName: `${column.title} (Hyperlink URL)`,
              description: `Make ${column.title} a hyperlink to this URL`,
              required: false,
            });

            fields[`hyperlink_sheet_${column.id}`] = {
              ...smartsheetCommon.hyperlink_sheet_id,
              displayName: `${column.title} (Link to Sheet)`,
              description: `Make ${column.title} a link to another sheet`,
              required: false,
            };

            fields[`hyperlink_report_${column.id}`] = {
              ...smartsheetCommon.hyperlink_report_id,
              displayName: `${column.title} (Link to Report)`,
              description: `Make ${column.title} a link to a report`,
              required: false,
            };
          }

          // Add cell validation and parsing options for all columns
          fields[`strict_${column.id}`] = Property.Checkbox({
            displayName: `${column.title} (Strict Parsing)`,
            description: `Enable strict parsing for ${column.title}. Set to false for lenient parsing.`,
            required: false,
            defaultValue: true,
          });

          fields[`override_validation_${column.id}`] = Property.Checkbox({
            displayName: `${column.title} (Override Validation)`,
            description: `Allow values outside validation limits for ${column.title}. Requires strict=false.`,
            required: false,
            defaultValue: false,
          });
        }

        return fields;
      } catch (error) {
        console.error('Failed to fetch columns for dynamic properties:', error);
        return {
          error_loading: Property.MarkDown({
            value: '❌ **Failed to load columns**\n\nUnable to load columns from the selected sheet. Please check:\n- Your connection is still valid\n- You have access to this sheet\n- The sheet exists\n\nTry refreshing or selecting a different sheet.',
          }),
        };
      }
    },
  }),

  // Dynamic row selector
  row_id: Property.Dropdown({
    displayName: 'Row',
    description: 'Select a row from the sheet',
    required: true,
    refreshers: ['sheet_id'],
    options: async ({ auth, sheet_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      if (!sheet_id) {
        return {
          disabled: true,
          placeholder: '📋 Please select a sheet first',
          options: [],
        };
      }

      try {
        const sheet = await getSheet(auth as unknown as string, sheet_id as unknown as string);
        const rows = sheet.rows || [];

        if (rows.length === 0) {
          return {
            disabled: true,
            placeholder: '📄 No rows found in this sheet',
            options: [],
          };
        }

        return {
          options: rows.slice(0, 100).map((row: any) => {
            // Get the primary column value for display
            const primaryCell = row.cells?.find((cell: any) =>
              sheet.columns?.find((col: any) => col.id === cell.columnId && col.primary)
            );
            const displayValue = primaryCell?.displayValue || primaryCell?.value || `Row ${row.rowNumber}`;

            return {
              value: row.id.toString(),
              label: `${displayValue} (Row ${row.rowNumber})`,
            };
          }),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load rows - check your permissions',
          options: [],
        };
      }
    },
  }),

  // Dynamic sheet selector for hyperlinks
  hyperlink_sheet_id: Property.Dropdown({
    displayName: 'Target Sheet',
    description: 'Select a sheet to link to',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      try {
        const sheets = await listSheets(auth as unknown as string);

        if (sheets.length === 0) {
          return {
            disabled: true,
            placeholder: '📂 No sheets found in your account',
            options: [],
          };
        }

        return {
          options: sheets.map((sheet: SmartsheetSheet) => ({
            value: sheet.id.toString(),
            label: sheet.name,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load sheets - check your permissions',
          options: [],
        };
      }
    },
  }),

  // Dynamic report selector for hyperlinks
  hyperlink_report_id: Property.Dropdown({
    displayName: 'Target Report',
    description: 'Select a report to link to',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      try {
        const reports = await listReports(auth as unknown as string);

        if (reports.length === 0) {
          return {
            disabled: true,
            placeholder: '📊 No reports found in your account',
            options: [],
          };
        }

        return {
          options: reports.map((report: SmartsheetReport) => ({
            value: report.id.toString(),
            label: `${report.name}${report.isSummaryReport ? ' (Summary)' : ' (Row Report)'}`,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load reports - check your permissions',
          options: [],
        };
      }
    },
  }),

  // Dynamic column selector for search/filter operations
  search_columns: Property.MultiSelectDropdown({
    displayName: 'Search Columns',
    description: 'Select specific columns to search within (leave empty to search all columns)',
    required: false,
    refreshers: ['sheet_id'],
    options: async ({ auth, sheet_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: '⚠️ Please authenticate with Smartsheet first',
          options: [],
        };
      }

      if (!sheet_id) {
        return {
          disabled: true,
          placeholder: '📋 Please select a sheet first',
          options: [],
        };
      }

      try {
        const columns = await getSheetColumns(auth as unknown as string, sheet_id as unknown as string);
        const searchableColumns = columns.filter(column => column.type?.toLowerCase() !== 'auto_number');

        if (searchableColumns.length === 0) {
          return {
            disabled: true,
            placeholder: '📄 No searchable columns found in this sheet',
            options: [],
          };
        }

        return {
          options: searchableColumns.map((column: SmartsheetColumn) => ({
            value: column.id.toString(),
            label: `${column.title} (${column.type || 'unknown'})`,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: '❌ Failed to load columns - check your permissions',
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
  type?: string;
  primary?: boolean;
  options?: string[];
  validation?: boolean;
  width?: number;
  hidden?: boolean;
  locked?: boolean;
  lockedForUser?: boolean;
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

export interface SmartsheetReport {
  id: number;
  name: string;
  accessLevel: 'ADMIN' | 'COMMENTER' | 'EDITOR' | 'EDITOR_SHARE' | 'OWNER' | 'VIEWER';
  isSummaryReport: boolean;
  ownerId: number;
  createdAt: string;
  modifiedAt: string;
  permalink: string;
  owner?: string;
  totalRowCount?: number;
  version?: number;
}

export interface SmartsheetReportsResponse {
  pageNumber: number;
  pageSize: number | null;
  totalPages: number;
  totalCount: number;
  data: SmartsheetReport[];
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
    url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}/columns?include=columnType`,
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

export async function listReports(
  accessToken: string,
  modifiedSince?: string
): Promise<SmartsheetReport[]> {
  // Build query parameters
  const queryParams: any = {};
  if (modifiedSince) {
    queryParams.modifiedSince = modifiedSince;
  }

  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${smartsheetCommon.baseUrl}/reports`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  };

  const response = await httpClient.sendRequest<SmartsheetReportsResponse>(request);
  return response.body.data || [];
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


