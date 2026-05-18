import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const CONTIGUITY_API_BASE_URL = 'https://api.contiguity.com';

export interface ContiguityRequestConfig {
    method: HttpMethod;
    endpoint: string;
    body?: any;
    auth: string;
}

export const contiguityHeaders = (auth: string): Record<string, string> => {
    return {
        authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
    };
};

export const contiguityRequest = (config: ContiguityRequestConfig): HttpRequest => {
    return {
        method: config.method,
        url: `${CONTIGUITY_API_BASE_URL}${config.endpoint}`,
        body: config.body,
        headers: contiguityHeaders(config.auth),
    };
};

export const _fetch = async (config: ContiguityRequestConfig) => {
    const request = contiguityRequest(config);
    return await httpClient.sendRequest(request);
};
