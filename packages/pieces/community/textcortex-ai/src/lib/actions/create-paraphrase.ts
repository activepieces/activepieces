import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createParaphrase = createAction({
    name: 'create_paraphrase',
    displayName: 'Create Paraphrase',
    description: 'Rewrite text while preserving its meaning.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text you want to paraphrase.',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use.',
            required: true,
            
            defaultValue: "gemini-2-0-flash",
            options: {
                options: [
                    { label: "Gemini 2.0 Flash", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
                    { label: "Grok 2", value: "grok-2" },
                ]
            }
        }),
        source_lang: Property.StaticDropdown({
            displayName: "Source Language",
            description: "The language of the source text. Default is auto-detection.",
            required: false,
            options: {
                options: [
                    { label: "Auto-Detect", value: "auto" },
                    { label: "English", value: "en" },
                    { label: "Spanish", value: "es" },
                    { label: "French", value: "fr" },
                    { label: "German", value: "de" },
                    { label: "Italian", value: "it" },
                    { label: "Portuguese", value: "pt" },
                ]
            }
        }),
        target_lang: Property.StaticDropdown({
            displayName: "Target Language",
            description: "The language for the paraphrased text.",
            required: false,
            options: {
                options: [
                    { label: "English (US)", value: "en-us" },
                    { label: "English (GB)", value: "en-gb" },
                    { label: "Spanish", value: "es" },
                    { label: "French", value: "fr" },
                    { label: "German", value: "de" },
                    { label: "Italian", value: "it" },
                    { label: "Portuguese (BR)", value: "pt-br" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values mean more creative, lower values are more deterministic.',
            required: false,
        }),
        max_tokens: Property.Number({
            displayName: 'Max Tokens',
            description: 'The maximum number of tokens to generate.',
            required: false,
        }),
    },
    async run(context) {
        const { text, model, source_lang, target_lang, temperature, max_tokens } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/paraphrases',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                text,
                model,
                source_lang,
                target_lang,
                temperature,
                max_tokens,
            },
        });

        return response.body;
    },
});