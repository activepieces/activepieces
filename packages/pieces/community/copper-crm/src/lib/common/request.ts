import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { COPPER_API_URL } from "./constants";

interface CopperAuthProps {
    api_key: string;
    user_email: string;
}

export async function makeCopperRequest<T = any>(
    method: HttpMethod,
    endpoint: string,
    auth: CopperAuthProps,
    body?: Record<string, any> | any[],
): Promise<T> {
    const headers: Record<string, string> = {
        'X-PW-AccessToken': auth.api_key,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': auth.user_email,
        'Content-Type': 'application/json',
    };

    const request: HttpRequest = {
        method,
        url: `${COPPER_API_URL}/${endpoint}`,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await httpClient.sendRequest(request);

    if (response.status >= 400) {
        throw new Error(`Copper API Error: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body;
}