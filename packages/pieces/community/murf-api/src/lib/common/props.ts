import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const MURF_API_URL = 'https://api.murf.ai/v1';


const getVoices = async (apiKey: string) => {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${MURF_API_URL}/speech/voices`,
        headers: {
            'api-key': apiKey,
        },
    };
    const response = await httpClient.sendRequest<any[]>(request);
    return response.body;
};


const getTranslationLanguages = async (apiKey: string) => {
    const voices = await getVoices(apiKey);
    const languageMap = new Map<string, string>();

  
    voices.forEach((voice: any) => {
        if (voice.supportedLocales) {
            Object.keys(voice.supportedLocales).forEach(localeCode => {
                if (!languageMap.has(localeCode)) {
                    languageMap.set(localeCode, voice.supportedLocales[localeCode].detail);
                }
            });
        }
    });


    return Array.from(languageMap, ([value, label]) => ({ label, value }));
};


export const murfCommon = {
    /**
     * A dynamic dropdown property to select a Murf AI voice.
     */
    voiceId: (required = true) => Property.Dropdown({
        displayName: 'Voice',
        description: 'The voice to be used for the audio generation.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            const voices = await getVoices(auth as string);
            return {
                disabled: false,
                options: voices.map((voice: any) => ({
                    label: `${voice.displayName} (${voice.locale})`,
                    value: voice.voiceId,
                })),
            };
        },
    }),

    /**
     * A dynamic dropdown property to select a voice style, dependent on the selected voice.
     */
    style: (required = false) => Property.Dropdown({
        displayName: 'Style',
        description: 'The voice style to be used.',
        required,
        refreshers: ['voiceId'],
        options: async ({ auth, voiceId }) => {
            if (!auth || !voiceId) return { disabled: true, placeholder: 'Select a voice first', options: [] };
            const voices = await getVoices(auth as string);
            const selectedVoice = voices.find((v: any) => v.voiceId === voiceId);
            const styles = selectedVoice?.availableStyles || [];
            return {
                disabled: false,
                options: styles.map((style: string) => ({ label: style, value: style })),
            };
        },
    }),

    /**
     * A dynamic dropdown property to select a target language for translation.
     */
    targetLanguage: (required = true) => Property.Dropdown({
        displayName: 'Target Language',
        description: 'The language to translate the text into.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            const languages = await getTranslationLanguages(auth as string);
            // Sort languages alphabetically for better UX
            languages.sort((a, b) => a.label.localeCompare(b.label));
            return {
                disabled: false,
                options: languages,
            };
        },
    }),

    /**
     * REVISED: A dynamic dropdown property to select a single locale.
     * @param {string} displayName - The name of the field.
     * @param {boolean} required - Whether the field is required.
     */
    locale: (displayName: string, required = true) => Property.Dropdown({
        displayName,
        description: 'The locale (language and region).',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            const languages = await getTranslationLanguages(auth as string);
            languages.sort((a, b) => a.label.localeCompare(b.label));
            return {
                disabled: false,
                options: languages,
            };
        },
    }),

    /**
     * NEW: A dynamic multi-select dropdown property to select multiple locales.
     * @param {string} displayName - The name of the field.
     * @param {boolean} required - Whether the field is required.
     */
    locales: (displayName: string, required = true) => Property.MultiSelectDropdown({
        displayName,
        description: 'The locales (language and region).',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            const languages = await getTranslationLanguages(auth as string);
            languages.sort((a, b) => a.label.localeCompare(b.label));
            return {
                disabled: false,
                options: languages,
            };
        },
    }),
};