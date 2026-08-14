const QUICKBOOKS_API_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';

export const quickbooksCommon = {
    minorVersion: '75',
    getApiUrl: (realmId: string) => {
        const baseUrl = QUICKBOOKS_API_URL_PRODUCTION;
        return `${baseUrl}/${realmId}`;
    },
};

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