import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const BASE_URL = `https://api.agentx.so/api/v1/access`;

export async function makeRequest<T = any>(
    apiKey: string,
    method: HttpMethod,
    path: string,
    body?: unknown
): Promise<T> {
    try {
        const response = await httpClient.sendRequest<T>({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: body as any,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`AgentX API error: ${error.message || String(error)}`);
    }
}
