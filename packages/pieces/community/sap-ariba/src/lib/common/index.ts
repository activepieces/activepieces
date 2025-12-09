import { HttpMethod, httpClient, HttpRequest, QueryParams } from "@activepieces/pieces-common";
import { sapAribaAuth } from "../auth";
import { AppConnectionValueForAuthProperty } from "@activepieces/pieces-framework";
import { AppConnectionType } from "@activepieces/shared";

export type SapAribaAuth = AppConnectionValueForAuthProperty<typeof sapAribaAuth>;

export const sapAribaCommon = {
    async getAccessToken(auth: SapAribaAuth): Promise<string | null> {
        if (auth.type === AppConnectionType.CUSTOM_AUTH && !('clientId' in auth.props)) {
            return null;
        }

        const oauthAuth = auth.props as {
            clientId: string;
            clientSecret: string;
            oauthServerUrl: string;
        };

        const credentials = Buffer.from(`${oauthAuth.clientId}:${oauthAuth.clientSecret}`).toString('base64');
        
        const params = new URLSearchParams();
        params.append('grant_type', 'openapi_2lo');

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${oauthAuth.oauthServerUrl}/v2/oauth/token`,
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(), 
        };
        
        const response = await httpClient.sendRequest<{ access_token: string }>(request);

        if (response.status !== 200) {
            throw new Error(`Failed to authenticate with SAP Ariba: ${JSON.stringify(response.body)}`);
        }
        
        return response.body.access_token;
    },

    async makeRequest<T>(
        auth: SapAribaAuth,
        method: HttpMethod,
        endpoint: string,
        queryParams?: QueryParams,
        body?: unknown,
        additionalHeaders?: Record<string, string>
    ): Promise<T> {
        const accessToken = await this.getAccessToken(auth);
        const apiKey = auth.props.apiKey;
        const baseUrl = auth.props.baseUrl;

        const headers: Record<string, string> = {
            apiKey: apiKey,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...additionalHeaders,
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const request: HttpRequest = {
            method,
            url: `${baseUrl}${endpoint}`,
            headers,
            queryParams,
            body,
        };

        const response = await httpClient.sendRequest<T>(request);
        return response.body;
    },
}
