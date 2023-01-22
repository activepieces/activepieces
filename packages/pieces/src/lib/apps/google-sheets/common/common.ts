import { HttpRequest } from "../../../common/http/core/http-request";
import { Property } from "../../../framework/property";
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';

export const googleSheetsCommon = {
    baseUrl: "https://sheets.googleapis.com/v4/spreadsheets",
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/spreadsheets"]
    }),
    getRowsBetween: getRowsBetween,
    appendGoogleSheetValues: appendGoogleSheetValues
}


type AppendGoogleSheetValuesParams = {
    values: string[];
    spreadSheetId: string;
    range: string;
    valueInputOption: ValueInputOption;
    majorDimension: Dimension;
    accessToken: string;
};

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

async function getRowsBetween(spreadsheetId: string, accessToken: string, startRow: number, endRow: number) {
    // Define the API endpoint and headers
    // Send the API request
    const request: HttpRequest<never> = {
        method: HttpMethod.GET,
        url: `${googleSheetsCommon.baseUrl}/${spreadsheetId}/values/Sheet1!A${startRow}:Z${endRow}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        }
    };
    const response = await httpClient.sendRequest<{ values: unknown }>(request);
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