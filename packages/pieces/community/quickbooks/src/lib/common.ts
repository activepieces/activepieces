import { AuthenticationType, httpClient, HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';

const QUICKBOOKS_API_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';

export const quickbooksCommon = {
    minorVersion: '75',
    getApiUrl: (realmId: string) => {
        const baseUrl = QUICKBOOKS_API_URL_PRODUCTION;
        return `${baseUrl}/${realmId}`;
    },
};

export type QuickbooksApiCallParams = {
    accessToken: string;
    companyId: string;
    method: HttpMethod;
    resourceUri: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
};

export async function quickbooksApiCall<T extends HttpMessageBody>({
    accessToken,
    companyId,
    method,
    resourceUri,
    query,
    body,
}: QuickbooksApiCallParams): Promise<T> {
    const apiUrl = quickbooksCommon.getApiUrl(companyId);

    const queryParams: Record<string, string> = { minorversion: quickbooksCommon.minorVersion };
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined) {
            queryParams[key] = String(value);
        }
    }

    const response = await httpClient.sendRequest<T>({
        method,
        url: `${apiUrl}${resourceUri}`,
        queryParams,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
        headers: {
            Accept: 'application/json',
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body,
    });

    return response.body;
}

export type QuickbooksQueryParams = {
    accessToken: string;
    companyId: string;
    query: string;
};

export async function quickbooksQuery<T extends HttpMessageBody>({
    accessToken,
    companyId,
    query,
}: QuickbooksQueryParams): Promise<T> {
    return quickbooksApiCall<T>({
        accessToken,
        companyId,
        method: HttpMethod.GET,
        resourceUri: '/query',
        query: { query },
    });
}

// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/change-data-capture
export interface QuickbooksCdcEntityBlock<T> {
    startPosition?: number;
    maxResults?: number;
    [entityName: string]: T[] | number | undefined;
}

export interface QuickbooksCdcResponse<T> {
    CDCResponse?: { QueryResponse: QuickbooksCdcEntityBlock<T>[] }[];
    Fault?: {
        Error: { Message: string; Detail?: string; code: string }[];
        type: string;
    };
    time?: string;
}

export interface QuickbooksEntityResponse<T> {
    QueryResponse?: {
        startPosition?: number;
        maxResults?: number;
        totalCount?: number;
    } & {
        [key: string]: T[] | undefined;
    };
    Fault?: {
        Error: {
            Message: string;
            Detail?: string;
            code: string;
        }[];
        type: string;
    };
    time?: string;
} 