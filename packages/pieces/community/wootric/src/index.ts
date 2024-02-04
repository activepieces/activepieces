
import { createPiece, Property, PieceAuth } from "@activepieces/pieces-framework";
import { createWootricSurvey } from "./lib/actions/create-survey";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const WOOTRIC_API_URL = 'https://api.wootric.com/';
export const WOOTRIC_IMAGE_URL = 'https://assets-production.wootric.com/assets/wootric-is-now-inmoment-250x108-85cb4900c62ff4d33200abafee7d63372d410abc5bf0cab90e80a07d4f4e5a31.png';

export const wootricAccessToken = async (username: string, password: string, store: any) => {
    if (store) {
        const storageAccessToken = await store.get('wootricAccessToken');

        if (storageAccessToken) {
            return storageAccessToken;
        }
    }
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${WOOTRIC_API_URL}/oauth/token`,
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: username,
            client_secret: password,
        }).toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    const response = await httpClient.sendRequest(request);
    const accessToken = response.body['access_token'];
    if (store) {
        store.put('wootricAccessToken', accessToken);
    }
    return accessToken;
};

export const wootricAuth = PieceAuth.BasicAuth({
    description: 'Enter your Wootric Client ID and Client Secret',
    required: true,
    username: {
        displayName: 'Client ID',
        description: 'Wootric Client ID',
    },
    password: {
        displayName: 'Client Secret',
        description: 'Wootric Client Secret',
    },
    validate: async (context) => {
        const { username, password } = context.auth;
        if (!username || !password) {
            return {
                valid: false,
                error: 'Empty Client ID or Client Secret',
            };
        }

        try {
            const data = await wootricAccessToken(username, password, {});
            if (data && data['access_token']) {
                return {
                    valid: true,
                };
            } else {
                return {
                    valid: false,
                    error: 'Unable to retrieve access token',
                };
            }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Client ID or Client Secret',
            };
        }
    },
});

export const wootric = createPiece({
    displayName: "Wootric",
    auth: wootricAuth,
    minimumSupportedRelease: '0.9.0',
    logoUrl: WOOTRIC_IMAGE_URL,
    authors: [],
    actions: [createWootricSurvey],
    triggers: [],
});
