import { Property, OAuth2PropertyValue, httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/framework";

export const googleSheetsCommon = {
    baseUrl: "https://sheets.googleapis.com/v4/spreadsheets",
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    }),
    spreadsheet_id: Property.Dropdown({
        displayName: "Spreadsheet",
        required: true,
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder:'Please authenticate first'
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const spreadsheets = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `https://www.googleapis.com/drive/v3/files`,
                queryParams: {
                    q: "mimeType='application/vnd.google-apps.spreadsheet'"
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
                    placeholder:'Please select a spreadsheet first'
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
    findSheetName:findSheetName
}



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

async function getValues(spreadsheetId: string, accessToken: string, sheetId: number): Promise<[string[]][]> {
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
    // Get the rows from the response
    return response.body.values;
}

export enum ValueInputOption {
    RAW = 'RAW',
    USER_ENTERED = 'USER_ENTERED',
}

export enum Dimension {
    ROWS = 'ROWS',
    COLUMNS = 'COLUMNS',
}
