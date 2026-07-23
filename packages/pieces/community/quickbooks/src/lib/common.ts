const QUICKBOOKS_API_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const QUICKBOOKS_API_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';

export const quickbooksCommon = {
    getApiUrl: (realmId: string) => {
        const baseUrl = QUICKBOOKS_API_URL_PRODUCTION;
        return `${baseUrl}/${realmId}`;
    },
};

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