import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";

export class InsightlyClient {
    private readonly baseUrl: string;
    private readonly authHeader: string;

    constructor(apiKey: string, pod: string) {
        this.baseUrl = `https://api.${pod}.insightly.com/v3.1`;
        this.authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;
    }

    async makeRequest<T>(
        method: HttpMethod,
        url: string,
        queryParams?: QueryParams,
        body?: object
    ): Promise<T> {
        const request: HttpRequest<object> = {
            method,
            url: `${this.baseUrl}${url}`,
            queryParams: queryParams,
            body: body,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": this.authHeader,
            },
        };
        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    async fetchAllRecords(objectType: string): Promise<Record<string, unknown>[]> {
        const allRecords: Record<string, unknown>[] = [];
        let skip = 0;
        const top = 500;
        let hasMore = true;

        while (hasMore) {
            const pageRecords = await this.makeRequest<Record<string, unknown>[]>(
                HttpMethod.GET,
                `/${objectType}`, { brief: 'true', top: top.toString(), skip: skip.toString() }
            );

            if (pageRecords && pageRecords.length > 0) {
                allRecords.push(...pageRecords);
                skip += top;
            } else {
                hasMore = false;
            }
        }
        return allRecords;
    }
}