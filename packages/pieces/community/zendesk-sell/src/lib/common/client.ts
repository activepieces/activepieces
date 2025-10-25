import {
    AuthenticationType,
    httpClient,
    HttpMethod,
    HttpRequest,
    HttpResponse,
    HttpMessageBody, 
} from '@activepieces/pieces-common';
import { ZendeskSellAuth } from './auth';


export const ZENDESK_SELL_API_URL = 'https://api.getbase.com';

export async function callZendeskApi<T>(
    method: HttpMethod,
    endpoint: string,
    auth: ZendeskSellAuth,
    body?: HttpMessageBody, 
    query?: Record<string, string> 
): Promise<HttpResponse<T>> {

    const request: HttpRequest = {
        method: method,
        url: `${ZENDESK_SELL_API_URL}/${endpoint}`,
        authentication: {
            type: AuthenticationType.BASIC,
            username: `${auth.email}/token`,
            password: auth.api_token,
        },
        body: body,
        queryParams: query, 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    return httpClient.sendRequest<T>(request);
}