import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest, getAccessTokenOrThrow } from "@activepieces/pieces-common";

export const googleSheetsCommon = {
    baseUrl: "https://sheets.googleapis.com/v4/spreadsheets",
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.readonly"]
    }),
    include_team_drives: Property.Checkbox({
        displayName: 'Include Team Drive Sheets',
        description: 'Determines if sheets from Team Drives should be included in the results.',
        defaultValue: false,
        required: true,
    }),
    spreadsheet_id: Property.Dropdown({
        displayName: "Spreadsheet",
        required: true,
        refreshers: ['authentication', 'include_team_drives'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const spreadsheets = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `https://www.googleapis.com/drive/v3/files`,
                queryParams: {
                    q: "mimeType='application/vnd.google-apps.spreadsheet'",
                    includeItemsFromAllDrives: propsValue['include_team_drives'] ? "true" : "false",
                    supportsAllDrives: "true"
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.files;
            return {
                disabled: false,
                options: spreadsheets.map((sheet: { id: string, name: string }) => {
                    return {
                        label: sheet.name,
                        value: sheet.id
                    }
                })
            };
        }
    }),
    sheet_id: Property.Dropdown({
        displayName: "Sheet",
        required: true,
        refreshers: ['authentication', 'spreadsheet_id'],
        options: async (propsValue) => {
            if (!propsValue['authentication'] || (propsValue['spreadsheet_id'] ?? '').toString().length === 0) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select a spreadsheet first'
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const sheets = (await listSheetsName(authProp['access_token'], propsValue['spreadsheet_id'] as string));
            return {
                disabled: false,
                options: sheets.map((sheet: { properties: { title: string, sheetId: number } }) => {
                    return {
                        label: sheet.properties.title,
                        value: sheet.properties.sheetId
                    }
                })
            };
        }
    }),
    getValues: getValues,
    appendGoogleSheetValues: appendGoogleSheetValues,
    updateGoogleSheetRow: updateGoogleSheetRow,
    findSheetName: findSheetName,
    deleteRow: deleteRow,
}



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

async function findSheetName(access_token: string, spreadsheet_id: string, sheetId: number) {
    const sheets = await listSheetsName(access_token, spreadsheet_id);
    return sheets.find(f => f.properties.sheetId === sheetId)?.properties.title;
}

async function listSheetsName(access_token: string, spreadsheet_id: string) {
    return (await httpClient.sendRequest<{ sheets: { properties: { title: string, sheetId: number } }[] }>({
        method: HttpMethod.GET,
        url: `https://sheets.googleapis.com/v4/spreadsheets/` + spreadsheet_id,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: access_token,
        }
    })).body.sheets;
}

async function updateGoogleSheetRow(params: UpdateGoogleSheetRowParams) {
    const requestBody = {
        majorDimension: Dimension.ROWS,
        range: `${params.sheetName}!A${params.rowIndex}:Z${params.rowIndex}`,
        values: [params.values],
    };
    const request: HttpRequest<typeof requestBody> = {
        method: HttpMethod.PUT,
        url: `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadSheetId}/values/${params.sheetName}!A${params.rowIndex}:Z${params.rowIndex}`,
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

async function appendGoogleSheetValues(params: AppendGoogleSheetValuesParams) {
    const requestBody = {
        majorDimension: params.majorDimension,
        range: params.range,
        values: params.values.map(val => ({ values: val })),
    };
    const request: HttpRequest<typeof requestBody> = {
        method: HttpMethod.POST,
        url: `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadSheetId}/values/${params.range}:append`,
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

async function getValues(spreadsheetId: string, accessToken: string, sheetId: number): Promise<{ row: number; values: { [x: string]: string[]; }[]; }[]> {
    // Define the API endpoint and headers
    // Send the API request
    const sheetName = await findSheetName(accessToken, spreadsheetId, sheetId);
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/${sheetName}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        }
    };
    const response = await httpClient.sendRequest<{ values: [string[]][] }>(request);
    if (response.body.values === undefined) return [];


    const res = [];
    for (let i = 0; i < response.body.values.length; i++) {
        res.push({
            row: i + 1,
            values: response.body.values[i].map((value, index) => {
                return {
                    [columnToLabel(index)]: value
                }
            })
        });

    }

    return res;
}

const columnToLabel = (columnIndex: number) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let label = '';

    while (columnIndex >= 0) {
        label = alphabet[columnIndex % 26] + label;
        columnIndex = Math.floor(columnIndex / 26) - 1;
    }

    return label;
};


async function deleteRow(spreadsheetId: string, sheetId: number, rowIndex: number, accessToken: string) {
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
                            dimension: "ROWS",
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

export enum ValueInputOption {
    RAW = 'RAW',
    USER_ENTERED = 'USER_ENTERED',
}

export enum Dimension {
    ROWS = 'ROWS',
    COLUMNS = 'COLUMNS',
}
