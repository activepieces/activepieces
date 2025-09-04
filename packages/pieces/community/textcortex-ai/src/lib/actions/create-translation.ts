import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createTranslation = createAction({
    name: 'create_translation',
    displayName: 'Create Translation',
    description: 'Translate input text into a target language.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text you want to translate.',
            required: true,
        }),
        target_lang: Property.StaticDropdown({
            displayName: 'Target Language',
            description: 'The language to translate the text into.',
            required: true,
            options: {
                options: [
                    { label: "English (US)", value: "en-us" },
                    { label: "Spanish", value: "es" },
                    { label: "French", value: "fr" },
                    { label: "German", value: "de" },
                    { label: "Japanese", value: "ja" },
                    { label: "Russian", value: "ru" },
                    { label: "Chinese", value: "zh" },
                ]
            }
        }),
        source_lang: Property.StaticDropdown({
            displayName: "Source Language",
            description: "The language of the source text. Leave blank to auto-detect.",
            required: false,
            options: {
                options: [
                    { label: "Auto-Detect", value: "auto" },
                    { label: "English", value: "en" },
                    { label: "Spanish", value: "es" },
                    { label: "French", value: "fr" },
                    { label: "German", value: "de" },
                    { label: "Japanese", value: "ja" },
                    { label: "Russian", value: "ru" },
                    { label: "Chinese", value: "zh" },
                ]
            }
        }),
    },
    async run(context) {
        const { text, target_lang, source_lang } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/translations',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                text,
                target_lang,
                source_lang,
            },
        });

        return response.body;
    },
});