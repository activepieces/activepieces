import {
    HttpMethod,
    HttpMessageBody,
    HttpResponse,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export interface CognosAuthValue {
    baseUrl: string;
    namespace: string;
    username: string;
    password: string;
}

export interface CognosSession {
    session_key: string;
}

/**
 * Creates a session with IBM Cognos Analytics and returns the session key
 */
export async function createCognosSession(auth: CognosAuthValue): Promise<string> {
    const response = await httpClient.sendRequest<{ session_key: string }>({
        method: HttpMethod.POST,
        url: `${auth.baseUrl}/api/v1/session`,
        body: {
            parameters: [
                {
                    name: 'CAMNamespace',
                    value: auth.namespace,
                },
                {
                    name: 'CAMUsername',
                    value: auth.username,
                },
                {
                    name: 'CAMPassword',
                    value: auth.password,
                },
            ],
        },
    });
    return response.body.session_key;
}

/**
 * Makes an authenticated API call to IBM Cognos Analytics
 */
export async function callCognosApi<T extends HttpMessageBody>(
    method: HttpMethod,
    auth: CognosAuthValue,
    endpoint: string,
    body?: HttpMessageBody,
    queryParams?: Record<string, string>
): Promise<HttpResponse<T>> {
    const sessionKey = await createCognosSession(auth);
    
    return await httpClient.sendRequest<T>({
        method: method,
        url: `${auth.baseUrl}/api/v1${endpoint}`,
        body,
        queryParams,
        headers: {
            'IBM-BA-Authorization': `CAM ${sessionKey}`,
        },
    });
}

/**
 * Common property definitions for IBM Cognos
 */
export const cognosCommon = {
    dataSource: Property.Dropdown({
        displayName: 'Data Source',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callCognosApi<{ datasources: { id: string; defaultName: string }[] }>(
                    HttpMethod.GET,
                    auth as CognosAuthValue,
                    '/datasources'
                );
                return {
                    disabled: false,
                    options: (response.body.datasources || []).map((ds) => ({
                        label: ds.defaultName || ds.id,
                        value: ds.id,
                    })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    placeholder: 'Failed to load data sources',
                    options: [],
                };
            }
        },
    }),
    
    contentObject: Property.Dropdown({
        displayName: 'Content Object',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callCognosApi<{ content: { id: string; defaultName: string }[] }>(
                    HttpMethod.GET,
                    auth as CognosAuthValue,
                    '/content'
                );
                return {
                    disabled: false,
                    options: (response.body.content || []).map((obj) => ({
                        label: obj.defaultName || obj.id,
                        value: obj.id,
                    })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    placeholder: 'Failed to load content objects',
                    options: [],
                };
            }
        },
    }),
};

