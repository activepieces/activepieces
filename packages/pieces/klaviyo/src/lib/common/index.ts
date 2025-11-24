import { HttpMessageBody, HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";

export const klaviyoCommon = {
    baseUrl: "https://a.klaviyo.com/api",
    
    makeRequest: async (method: HttpMethod, endpoint: string, apiKey: string, body?: HttpMessageBody, queryParams?: Record<string, string>) => {
        const request: HttpRequest = {
            method: method,
            url: `https://a.klaviyo.com/api${endpoint}`,
            headers: {
                "Authorization": `Klaviyo-API-Key ${apiKey}`,
                "revision": "2024-02-15", // The magic key for V3 API
                "content-type": "application/vnd.api+json",
                "accept": "application/vnd.api+json"
            },
            body: body,
            queryParams: queryParams
        };
        return await httpClient.sendRequest(request);
    }
};