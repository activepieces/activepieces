import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';


export const folkAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Enter your Folk API key',
    required: true,
    validate: async ({ auth }) => {
        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.folk.app/v1/users/me',
                headers: {
                    'Authorization': `Bearer ${auth}`,
                    'Content-Type': 'application/json',
                },
                queryParams: {
                    page: '1',
                    per_page: '1',
                },
            });

            if (response.status === 200) {
                return {
                    valid: true,
                };
            }

            return {
                valid: false,
                error: 'Invalid API key',
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid API key or unable to connect to Folk',
            };
        }
    },
});

export const BASE_URL = 'https://api.folk.app/v1';

export async function makeFolkRequest<T>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string>
): Promise<T> {
    const request: HttpRequest = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'Authorization': `Bearer ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        queryParams,
    };

    const response = await httpClient.sendRequest(request);
    return response.body as T;
}

export interface FolkContact {
    id: string;
    type: 'person' | 'company';
    name: string;
    emails?: string[];
    phones?: string[];
    urls?: string[];
    groups?: string[];
    custom_fields?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface FolkPerson extends FolkContact {
    type: 'person';
    first_name?: string;
    last_name?: string;
    job_title?: string;
    company_id?: string;
    avatar_url?: string;
}

export interface FolkCompany extends FolkContact {
    type: 'company';
    domain?: string;
    industry?: string;
    employee_count?: number;
    logo_url?: string;
}

export interface FolkGroup {
    id: string;
    name: string;
    type: string;
    contact_count: number;
    created_at: string;
    updated_at: string;
}

export interface FolkWebhook {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    created_at: string;
}

export interface FolkCustomField {
    key: string;
    label: string;
    type: 'text' | 'status' | 'tag' | 'assignee' | 'date' | 'number';
    value: any;
}