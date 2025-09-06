import { Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

export const murfCommon = {
    language: Property.Dropdown({
        displayName: "Language",
        description: "Select the language for Murf voices",
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

            // Fetch available languages
            const response = await makeRequest((auth as any).murfApiKey, HttpMethod.GET, "/languages");

            const langs = (response.languages || []).map((lang: { name: string; code: string }) => ({
                label: lang.name,
                value: lang.code,
            }));

            return { disabled: false, options: langs };
        },
    }),

    voiceId: Property.Dropdown({
        displayName: "Voice",
        description: "Choose the voice for text-to-speech",
        required: true,
        refreshers: ["language"],
        options: async ({ auth, language }) => {
            if (!auth || !language) {
                return {
                    disabled: true,
                    placeholder: "Please select a language first.",
                    options: [],
                };
            }

            const response = await makeRequest(
                (auth as any).murfApiKey,
                HttpMethod.GET,
                `/voices?language=${language}`
            );

            const voices = response.voices.map((v: { id: string; name: string; gender: string }) => ({
                label: `${v.name} (${v.gender})`,
                value: v.id,
            }));

            return {
                disabled: false,
                options: voices,
            };
        },
    }),

    projectId: Property.Dropdown({
        displayName: "Project",
        description: "Select a Murf project",
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

            const response = await makeRequest((auth as any).murfApiKey, HttpMethod.GET, "/projects");

            const projects = response.projects.map((p: { id: string; name: string }) => ({
                label: p.name,
                value: p.id,
            }));

            return {
                disabled: false,
                options: projects,
            };
        },
    }),
};

export const languageDropdown = Property.StaticDropdown({
    displayName: "Target Language",
    description: "Select the target language for translation",
    required: true,
    options: {
        disabled: false,
        options: [
            { label: "Spanish (es-ES)", value: "es-ES" },
            { label: "French (fr-FR)", value: "fr-FR" },
            { label: "German (de-DE)", value: "de-DE" },
            { label: "Hindi (hi-IN)", value: "hi-IN" },
            { label: "English - US (en-US)", value: "en-US" },
            { label: "English - UK (en-UK)", value: "en-UK" },
            { label: "Chinese - Simplified (zh-CN)", value: "zh-CN" },
            { label: "Japanese (ja-JP)", value: "ja-JP" },
        ],
    },
});
