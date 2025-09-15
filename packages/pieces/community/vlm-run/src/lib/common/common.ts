import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const vlmRunAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Enter your VLM Run API key.',
    required: true,
});

export const vlmRunCommon = {
    baseUrl: 'https://api.vlm.run/v1',

    baseHeaders: (apiKey: string) => ({
        Authorization: `Bearer ${apiKey}`,
    }),

    endpoints: {
        listFiles: '/files',
        analyzeAudio: '/audio/generate',
        analyzeImage: '/image/generate',
        analyzeDocument: '/document/generate',
        analyzeVideo: '/video/generate',
        getFile: (fileId: string) => `/files/${fileId}`,
    },

    listFiles: async (apiKey: string, props?: { limit?: number, skip?: number }) => {
        const query: QueryParams = {};
        if (props?.limit) {
            query['limit'] = props.limit.toString();
        }
        if (props?.skip) {
            query['skip'] = props.skip.toString();
        }


        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.listFiles}`,
            headers: vlmRunCommon.baseHeaders(apiKey),
            queryParams: query,
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    getFile: async ({ apiKey, file_id }: { apiKey: string, file_id: string }) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.getFile(file_id)}`,
            headers: vlmRunCommon.baseHeaders(apiKey),
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    analyzeAudio: async (apiKey: string, body: Record<string, unknown>) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeAudio}`,
            headers: {
                ...vlmRunCommon.baseHeaders(apiKey),
                'Content-Type': 'application/json',
            },
            body: body,
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    analyzeImage: async (apiKey: string, body: Record<string, unknown>) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeImage}`,
            headers: {
                ...vlmRunCommon.baseHeaders(apiKey),
                'Content-Type': 'application/json',
            },
            body: body,
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    analyzeDocument: async (apiKey: string, body: Record<string, unknown>) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeDocument}`,
            headers: {
                ...vlmRunCommon.baseHeaders(apiKey),
                'Content-Type': 'application/json',
            },
            body: body,
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    analyzeVideo: async (apiKey: string, body: Record<string, unknown>) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeVideo}`,
            headers: {
                ...vlmRunCommon.baseHeaders(apiKey),
                'Content-Type': 'application/json',
            },
            body: body,
        };
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
};