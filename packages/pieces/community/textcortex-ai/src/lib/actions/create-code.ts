import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createCode = createAction({
    name: 'create_code',
    displayName: 'Create Code',
    description: 'Generate code in a specified programming language based on instructions.',
    props: {
        mode: Property.StaticDropdown({
            displayName: 'Programming Language',
            description: 'The programming language for the code generation.',
            required: true,
            options: {
                options: [
                    { label: 'Python', value: 'python' },
                    { label: 'JavaScript', value: 'javascript' },
                    { label: 'Java', value: 'java' },
                    { label: 'Go', value: 'go' },
                    { label: 'PHP', value: 'php' },
                    { label: 'JavaScript Regex', value: 'js_regex' },
                ]
            }
        }),
        text: Property.LongText({
            displayName: 'Instructions',
            description: 'Describe the code you want to generate (e.g., "create a function that sums two numbers").',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use for code generation.',
            required: false,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash (Default)", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values are more creative.',
            required: false,
        }),
        max_tokens: Property.Number({
            displayName: 'Max Tokens',
            description: 'The maximum number of tokens to generate for the code.',
            required: false,
        }),
    },
    async run(context) {
        const { mode, text, model, temperature, max_tokens } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/codes',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                mode,
                text,
                model,
                temperature,
                max_tokens,
            },
        });

        return response.body;
    },
});