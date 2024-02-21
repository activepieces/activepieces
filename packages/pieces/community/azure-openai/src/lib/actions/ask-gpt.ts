import { AzureOpenAIAuth } from '../../';
import {
    Property,
    StoreScope,
    Validators,
    createAction,
} from '@activepieces/pieces-framework';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

export const askGpt = createAction({
    name: 'ask_gpt',
    displayName: 'Ask GPT',
    description: 'Ask ChatGPT anything you want!',
    props: {
        deploymentId: Property.ShortText({
            displayName: 'Deployment ID',
            description: 'The ID of your model deployment or model to use.',
            defaultValue: 'gpt-3.5-turbo',
            required: true,
        }),
        prompt: Property.LongText({
            displayName: 'Question',
            required: true,
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            required: false,
            description:
                'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
            validators: [Validators.minValue(0), Validators.maxValue(1.0)],
            defaultValue: 0.9,
        }),
        maxTokens: Property.Number({
            displayName: 'Maximum Tokens',
            required: true,
            description:
                "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion depending on the model. Don't set the value to maximum and leave some tokens for the input. (One token is roughly 4 characters for normal English text)",
            defaultValue: 2048,
        }),
        topP: Property.Number({
            displayName: 'Top P',
            required: false,
            description:
                'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
            defaultValue: 1,
        }),
        frequencyPenalty: Property.Number({
            displayName: 'Frequency penalty',
            required: false,
            description:
                "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
            defaultValue: 0,
        }),
        presencePenalty: Property.Number({
            displayName: 'Presence penalty',
            required: false,
            description:
                "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
            defaultValue: 0.6,
        }),
        memoryKey: Property.ShortText({
            displayName: 'Memory Key',
            description:
                'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave ChatGPT without memory of previous messages.',
            required: false,
        }),
        roles: Property.Array({
            displayName: 'Roles',
            required: false,
            description: 'Array of roles to specify more accurate response',
            defaultValue: ['You are a helpful assistant.'],
        }),
    },

    async run(context) {
        const { propsValue, store } = context;
        const auth: AzureOpenAIAuth = context.auth as AzureOpenAIAuth;

        const openai = new OpenAIClient(
            auth.endpoint,
            new AzureKeyCredential(auth.apiKey)
        );

        let messageHistory: string[] | null = [];
        // If memory key is set, retrieve messages stored in history
        if (propsValue.memoryKey) {
            messageHistory = (await store.get(propsValue.memoryKey, StoreScope.PROJECT)) ?? [];
        }

        // Add user prompt to message history
        messageHistory.push(propsValue.prompt);

        // Add system instructions if set by user
        const roles = propsValue.roles ? (propsValue.roles as string[]) : [];

        const completion = await openai.getCompletions(propsValue.deploymentId, [...roles, ...messageHistory], {
            maxTokens: propsValue.maxTokens,
            temperature: propsValue.temperature,
            frequencyPenalty: propsValue.frequencyPenalty,
            presencePenalty: propsValue.presencePenalty,
            topP: propsValue.topP,
        });

        return completion.choices[0].text;
    },
});
