import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";

export const FIREFLIES_API_URL = "https://api.fireflies.ai/graphql";

export interface FirefliesGraphQLResponse<T> {
    data?: T;
    errors?: {
        message: string;
        extensions?: {
            code: string;
        };
    }[];
}

export async function callFirefliesApi<T = unknown>(
    apiKey: string,
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    const request: HttpRequest<{ query: string; variables?: Record<string, unknown> }> = {
        method: HttpMethod.POST,
        url: FIREFLIES_API_URL,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: {
            query,
            variables,
        },
    };

    const response = await httpClient.sendRequest<FirefliesGraphQLResponse<T>>(request);

    if (response.body?.errors) {
        const error = response.body.errors[0];
        // Consider throwing a more specific error or logging details
        throw new Error(
            `Fireflies API error: ${error.message} (Code: ${error.extensions?.code || 'UNKNOWN'})`
        );
    }

    if (!response.body?.data) {
        throw new Error("Fireflies API did not return data.");
    }

    return response.body.data;
}
