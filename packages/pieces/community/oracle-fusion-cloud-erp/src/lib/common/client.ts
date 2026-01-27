import {
    HttpMessageBody,
    HttpMethod,
    QueryParams,
    httpClient,
    HttpRequest,
    HttpHeaders,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../index';

type OracleAuthValue = PiecePropValueSchema<typeof oracleFusionCloudErpAuth>;

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
    private credentials: string;

    constructor(
        private serverUrl: string,
        username: string,
        password: string
    ) {
        this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
    }

    async makeRequest<T extends HttpMessageBody>(
        method: HttpMethod,
        resourceUri: string,
        query?: filterParams,
        body?: any,
        headers?: HttpHeaders
    ): Promise<T> {
        const baseUrl = `${this.serverUrl}/fscmRestApi/resources/11.13.18.05`;
        const params: QueryParams = {};
        const requestHeaders: HttpHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.credentials}`,
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
            request,
            { 'Content-Type': 'application/vnd.oracle.adf.resourceitem+json' }
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

    async executeAction(actionEndpoint: string, payload: Record<string, any>): Promise<OracleRecord> {
        return await this.makeRequest(
            HttpMethod.POST,
            actionEndpoint,
            undefined,
            payload,
            { 'Content-Type': 'application/vnd.oracle.adf.action+json' }
        );
    }
}

export function makeClient(auth: OracleAuthValue) {
    const client = new OracleFusionAPIClient(
        auth.serverUrl,
        auth.username,
        auth.password
    );
    return client;
}
