import { HttpMethod, httpClient, HttpRequest, HttpMessageBody } from "@activepieces/pieces-common";

export const BASE_URL = "https://api.slidespeak.co/api/v1";


export async function makeRequest<T extends object>(
    apiKey: string,
    method: HttpMethod,
    path: string,
    body?: object
): Promise<T> {
    const request: HttpRequest = {
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'X-API-key': apiKey,
            'Content-Type': 'application/json'
        },
        body,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
}


export async function makeRequestMultipart<T extends object>(
    apiKey: string,
    path: string,
    body: HttpMessageBody
): Promise<T> {
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${BASE_URL}${path}`,
        headers: {
            'X-API-key': apiKey,
        },
        body,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
}