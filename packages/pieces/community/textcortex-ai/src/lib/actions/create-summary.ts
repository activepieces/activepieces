import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createSummary = createAction({
    name: 'create_summary',
    displayName: 'Create Summary',
    description: 'Summarize input text to a concise form.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text you want to summarize.',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use for summarization.',
            required: false,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash (Default)", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values are more creative.',
            required: false,
        }),
        max_tokens: Property.Number({
            displayName: 'Max Summary Tokens',
            description: 'The maximum number of tokens for the generated summary.',
            required: false,
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
                ]
            }
        }),
    },
    async run(context) {
        const { ...payload } = context.propsValue;

        delete (payload as any).auth;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/summarizations',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: payload,
        });

        return response.body;
    },
});