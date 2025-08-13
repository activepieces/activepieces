import {
    HttpMethod,
    QueryParams,
    httpClient,
    HttpRequest,
} from '@activepieces/pieces-common';

export async function hunterApiCall({
    apiKey,
    endpoint,
    method,
    qparams,
    body,
}: {
    apiKey: string;
    endpoint: string;
    method: HttpMethod;
    qparams?: QueryParams;
    body?: any;
}) {
    const queryParams: QueryParams = {
        ...(qparams ?? {}),
        api_key: apiKey,
    };

    const request: HttpRequest = {
        url: `https://api.hunter.io/v2${endpoint}`,
        method,
        queryParams,
        body,
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
}
