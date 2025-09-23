import { Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";


export const API_BASE_URL = "https://client.camb.ai/apis";
export const POLLING_INTERVAL_MS = 5000;
export const LONG_POLLING_INTERVAL_MS = 10000;
export const MAX_POLLING_ATTEMPTS = 180;
export const LONG_MAX_POLLING_ATTEMPTS = 120;

type Voice = {
    id: number;
    voice_name: string;
};

type Language = {
    id: number;
    language: string;
    short_name: string;
};


export const listVoicesDropdown = Property.Dropdown({
    displayName: 'Voice',
    description: 'Select the voice to generate the speech.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please authenticate first',
            };
        }
        const response = await httpClient.sendRequest<Voice[]>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/list-voices`,
            headers: {
                'x-api-key': auth as string,
            },
        });
        const voices = response.body ?? [];
        return {
            disabled: false,
            options: voices.map((voice) => ({
                label: voice.voice_name,
                value: voice.id,
            })),
        };
    },
});


export const listSourceLanguagesDropdown = Property.Dropdown({
    displayName: 'Source Language',
    description: 'Select the original language of the input text.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please authenticate first',
            };
        }
        const response = await httpClient.sendRequest<Language[]>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/source-languages`,
            headers: {
                'x-api-key': auth as string,
            },
        });
        const languages = response.body ?? [];
        return {
            disabled: false,
            options: languages.map((lang) => ({
                label: `${lang.language} (${lang.short_name})`,
                value: lang.id,
            })),
        };
    },
});


export const listTargetLanguagesDropdown = Property.Dropdown({
    displayName: 'Target Language',
    description: 'Select the language to translate the text into.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please authenticate first',
            };
        }
        const response = await httpClient.sendRequest<Language[]>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/target-languages`,
            headers: {
                'x-api-key': auth as string,
            },
        });
        const languages = response.body ?? [];
        return {
            disabled: false,
            options: languages.map((lang) => ({
                label: `${lang.language} (${lang.short_name})`,
                value: lang.id,
            })),
        };
    },
});