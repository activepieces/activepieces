import { createAction, Property } from "@activepieces/pieces-framework";

import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const sendPrompt = createAction({
    name: 'send_prompt',
    displayName: 'Send Prompt',
    description: 'Send a custom prompt to TextCortex AI and generate a completion.',
    
    props: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'The prompt to be sent to the AI.',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use for the completion.',
            required: true,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
                    { label: "Grok 2", value: "grok-2" },
                ]
            },
            defaultValue: 'chat-sophos-1'
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Lower values make the model more deterministic.',
            required: false,
        }),
        max_tokens_to_generate: Property.Number({
            displayName: 'Max Tokens',
            description: 'The maximum number of tokens to generate in the completion.',
            required: false,
        })
    },
    async run(context) {
        const { prompt, model, temperature, max_tokens_to_generate } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/completions',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                // 'context.auth' automatically contains the API key from the piece's auth setting
                token: context.auth as string,
            },
            body: {
                text:prompt,
                model,
                temperature,
                max_tokens_to_generate,
                n: 1, 
            },
        });

        return response.body;
    },
});