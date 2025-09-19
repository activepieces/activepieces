import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://api2.frontapp.com";

export enum ContentType {
    JSON = "application/json",
    FORM_DATA = "multipart/form-data",
}

export async function makeRequest<T>(
    api_key: string,
    method: HttpMethod,
    path: string,
    bodyOrQuery?: Record<string, unknown>,
    contentType: ContentType = ContentType.JSON,
): Promise<T> {
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${BASE_URL}${path}${method === HttpMethod.GET && bodyOrQuery ? `?${new URLSearchParams(bodyOrQuery as Record<string, string>).toString()}` : ""}`,
        headers: {
            accept: "application/json",
            authorization: `Bearer ${api_key}`,
            "content-type": contentType,
        },
        body: method !== HttpMethod.GET ? bodyOrQuery : undefined,
    });

    return response.body;
}