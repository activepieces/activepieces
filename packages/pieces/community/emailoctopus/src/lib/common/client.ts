import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const emailOctopusApiUrl = 'https://api.emailoctopus.com';


export interface EmailOctopusListDetails extends EmailOctopusList {
    fields: {
        tag: string;
        type: 'text' | 'number' | 'date'|'choice_single'|'choice_multiple'
        label: string;
        choices:string[]
    }[];
}

export class EmailOctopusClient {
    constructor(private apiKey: string) {}

    async makeRequest<T>(method: HttpMethod, url: string, body?: object): Promise<T> {
        const request: HttpRequest<object> = {
            method,
            url: `${emailOctopusApiUrl}${url}`,
            body: body,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization":`Bearer ${this.apiKey}`
            },
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
    

    async getList(listId: string): Promise<EmailOctopusListDetails> {
        return await this.makeRequest<EmailOctopusListDetails>(
            HttpMethod.GET,
            `/lists/${listId}`
        );
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