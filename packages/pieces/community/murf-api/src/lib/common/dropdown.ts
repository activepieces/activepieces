import { Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

// Helper to fetch voices
const getVoices = async (apiKey: string) => {
    return await makeRequest(apiKey, HttpMethod.GET, "/speech/voices");
};

// Helper to build unique language list
const getLanguages = async (apiKey: string) => {
    const voices = await getVoices(apiKey);
    const languageMap = new Map<string, string>();

    voices.forEach((voice: any) => {
        if (voice.supportedLocales) {
            Object.keys(voice.supportedLocales).forEach((localeCode) => {
                if (!languageMap.has(localeCode)) {
                    languageMap.set(
                        localeCode,
                        voice.supportedLocales[localeCode].detail || localeCode
                    );
                }
            });
        }
    });

    return Array.from(languageMap, ([value, label]) => ({ label, value }));
};

export const murfCommon = {
    language: Property.Dropdown({
        displayName: "Language",
        description: "Select your preferred language for the translated output.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Murf account first.",
                    options: [],
                };
            }

            const langs = await getLanguages(auth as string);
            return {
                disabled: false,
                options: langs,
            };
        },
    }),

    voiceId: Property.Dropdown({
        displayName: "Voice",
        description: "Choose a voice for converting text into speech",
        required: true,
        refreshers: ["language"],
        options: async ({ auth, language }) => {
            if (!auth|| !language) {
                return {
                    disabled: true,
                    placeholder: "Please select a language and connect your Murf account first.",
                    options: [],
                };
            }

            const voices = await getVoices(auth as string);
            const filtered = voices.filter((v: any) =>
                Object.keys(v.supportedLocales || {}).includes(language as string)
            );

            return {
                disabled: false,
                options: filtered.map((v: any) => ({
                    label: `${v.displayName} (${v.gender}, ${v.locale})`,
                    value: v.voiceId,
                })),
            };
        },
    }),
    sourceLocale: Property.Dropdown({
        displayName: "Source Locale",
        description: "Select the source locale for input text.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Murf account first.",
                    options: [],
                };
            }

            const voices = await getVoices(auth as string);

            const localeMap = new Map<string, string>();
            voices.forEach((voice: any) => {
                if (voice.supportedLocales) {
                    Object.entries(voice.supportedLocales).forEach(([localeCode, localeData]: any) => {
                        if (!localeMap.has(localeCode)) {
                            localeMap.set(localeCode, localeData.detail);
                        }
                    });
                }
            });

            return {
                disabled: false,
                options: Array.from(localeMap, ([value, label]) => ({ value, label })),
            };
        },
    }),

};

