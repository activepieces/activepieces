import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest, getAccessTokenOrThrow } from "@activepieces/pieces-common";

export const excelCommon = {
    baseUrl: "https://graph.microsoft.com/v1.0/me/drive/items",
    workbook_id: Property.Dropdown({
        displayName: "Workbook",
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
            const workbooks: { id: string, name: string }[] = (await httpClient.sendRequest<{ value: { id: string; name: string; }[]; }>({
                method: HttpMethod.GET,
                url: `https://graph.microsoft.com/v1.0/me/drive/root/search(q='.xlsx')`,
                queryParams: {
                    filter: "file ne null and file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.value;
            return {
                disabled: false,
                options: workbooks.map((workbook: { id: string; name: string; }) => {
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
        displayName: "Worksheet",
        required: true,
        refreshers: ['workbook_id'],
        options: async ({ auth, workbook_id }) => {
            if (!auth || !workbook_id) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select a workbook first'
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const worksheets: { id: string, name: string }[] = (await httpClient.sendRequest<{ value: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `${excelCommon.baseUrl}/${workbook_id}/workbook/worksheets`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.value;

            return {
                disabled: false,
                options: worksheets.map((worksheet: { id: string, name: string }) => {
                    return {
                        label: worksheet.name,
                        value: worksheet.name
                    }
                })
            };
        }
    }),
    table_id: Property.Dropdown({
        displayName: "Table",
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
            const tables: { id: string, name: string }[] = (await httpClient.sendRequest<{ value: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `${excelCommon.baseUrl}/${workbook_id}/workbook/worksheets/${worksheet_id}/tables`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.value;

            return {
                disabled: false,
                options: tables.map((table: { id: string, name: string }) => {
                    return {
                        label: table.name,
                        value: table.id
                    };
                })
            };
        }
    }),
    getHeaders: async function (workbookId: string, accessToken: string, worksheetId: string) {
        const response = await httpClient.sendRequest<{ values: string[][] }>({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/${workbookId}/workbook/worksheets/${worksheetId}/usedRange(valuesOnly=true)`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            }
        });
        return response.body.values[0];
    },
    getLastUsedRow: async function (workbookId: string, worksheetId: string, accessToken: string): Promise<number> {
        const url = `${excelCommon.baseUrl}/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: url,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            }
        };

        const response = await httpClient.sendRequest(request);
        const usedRange = response.body["address"].split('!')[1];
        const [, lastCell] = usedRange.split(':');
        const lastRow = parseInt(lastCell.match(/\d+/)[0], 10);

        return lastRow;
    },
    getLastUsedColumn: async function (workbookId: string, worksheetId: string, accessToken: string): Promise<number> {
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: url,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            }
        };

        const response = await httpClient.sendRequest(request);
        const usedRange = response.body["address"].split('!')[1];
        const [, lastCell] = usedRange.split(':');
        const lastColumnLetter = lastCell.match(/[A-Z]+/)[0];

        return lastColumnLetter;
    },
    getAllRows: async function (workbookId: string, worksheetId: string, accessToken: string) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/${workbookId}/workbook/worksheets/${worksheetId}/usedRange(valuesOnly=true)`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            }
        });

        const rows = response.body["values"];
        console.log("AAAAAAAAAAAAAAAAAA", rows)
        return rows;
    },
}