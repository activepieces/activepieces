import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { PiecePropValueSchema } from "@activepieces/pieces-framework";
import { emailOctopusAuth } from "./auth";

const emailOctopusApiUrl = 'https://api.emailoctopus.com/api/1.6';

export class EmailOctopusClient {
    constructor(private apiKey: string) { }

    async makeRequest<T>(method: HttpMethod, url: string, body?: object): Promise<T> {
        const request: HttpRequest<object> = {
            method: method,
            url: `${emailOctopusApiUrl}${url}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: this.apiKey,
            },
            body: body,
        };

        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    async getLists(): Promise<EmailOctopusList[]> {
        const response = await this.makeRequest<{ data: EmailOctopusList[] }>(
            HttpMethod.GET,
            '/lists'
        );
        return response.data;
    }

    async getCampaigns(): Promise<EmailOctopusCampaign[]> {
        const response = await this.makeRequest<{ data: EmailOctopusCampaign[] }>(
            HttpMethod.GET,
            '/campaigns'
        );
        return response.data;
    }
}

export interface EmailOctopusList {
    id: string;
    name: string;
    created_at: string;
}

export interface EmailOctopusCampaign {
    id: string;
    name: string;
    status: string;
    created_at: string;
}