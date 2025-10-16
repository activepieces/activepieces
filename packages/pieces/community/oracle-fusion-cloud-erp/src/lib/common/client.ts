import { oracleFusionCloudErpAuth } from '../../index';
import {
    HttpMessageBody,
    HttpMethod,
    QueryParams,
    httpClient,
    HttpRequest,
    AuthenticationType,
    HttpHeaders,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

interface OracleAPIResponse<T> {
    items: T[];
    count: number;
    hasMore: boolean;
    limit: number;
    offset: number;
    links: any[];
}

interface OracleRecord {
    [key: string]: any;
}

export type filterParams = Record<
    string,
    string | number | string[] | undefined
>;

export class OracleFusionAPIClient {
    constructor(
        private serverUrl: string,
        private accessToken: string
    ) {}

    async makeRequest<T extends HttpMessageBody>(
        method: HttpMethod,
        resourceUri: string,
        query?: filterParams,
        body?: any,
        headers?: HttpHeaders
    ): Promise<T> {
        const baseUrl = `${this.serverUrl}/fscmRestApi/resources/latest`;
        const params: QueryParams = {};
        const requestHeaders: HttpHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== null && value !== undefined) {
                    params[key] = String(value);
                }
            }
        }

        const request: HttpRequest = {
            method: method,
            url: baseUrl + resourceUri,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: this.accessToken,
            },
            headers: requestHeaders,
            queryParams: params,
            body: body,
        };

        const response = await httpClient.sendRequest<T>(request);
        return response.body;
    }

    async createRecord(endpoint: string, request: Record<string, any>): Promise<OracleRecord> {
        return await this.makeRequest(
            HttpMethod.POST,
            endpoint,
            undefined,
            request
        );
    }

    async updateRecord(endpoint: string, request: Record<string, any>): Promise<OracleRecord> {
        return await this.makeRequest(
            HttpMethod.PATCH,
            endpoint,
            undefined,
            request,
            { 'Content-Type': 'application/vnd.oracle.adf.resourceitem+json' }
        );
    }

    async getRecord(endpoint: string): Promise<OracleRecord> {
        return await this.makeRequest(HttpMethod.GET, endpoint);
    }

    async deleteRecord(endpoint: string): Promise<void> {
        await this.makeRequest(HttpMethod.DELETE, endpoint);
    }

    async searchRecords<T = OracleRecord>(
        endpoint: string,
        params: filterParams
    ): Promise<OracleAPIResponse<T>> {
        return await this.makeRequest<OracleAPIResponse<T>>(
            HttpMethod.GET,
            endpoint,
            params
        );
    }

    async getBusinessObjects(): Promise<any[]> {
        return await this.makeRequest(HttpMethod.GET, '/');
    }
}

export function makeClient(
    auth: PiecePropValueSchema<typeof oracleFusionCloudErpAuth>
) {
    const client = new OracleFusionAPIClient(
        auth.props?.['server_url'] as string,
        auth.access_token
    );
    return client;
}
