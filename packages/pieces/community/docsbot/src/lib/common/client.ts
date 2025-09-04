import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = "https://docsbot.ai";

export async function makeRequest(
    apiKey: string,
    method: HttpMethod,
    path: string,
    queryParams?: Record<string, string>,
    body?: unknown
) {
    const queryString = queryParams
        ? "?" + new URLSearchParams(queryParams).toString()
        : "";

    const response = await httpClient.sendRequest({
        method,
        url: `${BASE_URL}${path}${queryString}`,
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: method === HttpMethod.POST ? body : undefined,
    });

    return response.body;
}
