import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { ServiceNowAuth } from "./auth";

export class ServiceNowClient {
    constructor(private auth: ServiceNowAuth) {}

    async makeRequest<T>(
        method: HttpMethod,
        resource: string, 
        body?: object,
        queryParams?: Record<string, string>
    ): Promise<T> {

        const url = new URL(`${this.auth.instance_url}/api/now${resource}`);
        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        const request: HttpRequest<object | undefined> = {
            method,
            url: url.toString(),
            body: body,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "x-sn-apikey": this.auth.api_key
            },
        };

        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }
}