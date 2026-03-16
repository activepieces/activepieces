// FILE: packages/pieces/community/src/lib/canva/common/index.ts
import { HttpMethod, httpClient, HttpMessageBody, AuthenticationType } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export async function callCanvaApi<T>(
    endpoint: string,
    method: HttpMethod,
    auth: OAuth2PropertyValue,
    body?: HttpMessageBody,
    queryParams?: Record<string, string>
): Promise<T> {
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${CANVA_API_BASE}${endpoint}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN, // FIXED: Correct enum for authentication
            token: auth.accessToken,
        },
        body,
        queryParams,
    });

    return response.body;
}
