import { AzureOpenAIAuth } from '../../';
import {
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { calculateMessagesTokenSize, exceedsHistoryLimit, reduceContextSize } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const askGpt = createAction({
    name: 'ask_gpt',
    displayName: 'Ask GPT',
    description: 'Ask ChatGPT anything you want!',
    props: {
        deploymentId: Property.ShortText({
            displayName: 'Deployment Name',
            description: 'The name of your model deployment.',
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
        roles: Property.Json({
            displayName: 'Roles',
            required: false,
            description: 'Array of roles to specify more accurate response',
            defaultValue: [
                { role: 'system', content: 'You are a helpful assistant.' },
            ],
        }),
    },

    async run(context) {
        const { propsValue, store } = context;
        const auth: AzureOpenAIAuth = context.auth as AzureOpenAIAuth;

        await propsValidation.validateZod(propsValue, {
            temperature: z.number().min(0).max(1.0).optional(),
            frequencyPenalty: z.number().min(-2.0).max(2.0).optional(),
            presencePenalty: z.number().min(-2.0).max(2.0).optional(),
        });

        const openai = new OpenAIClient(
            auth.endpoint,
            new AzureKeyCredential(auth.apiKey)
        );

        let messageHistory: any[] | null = [];
        // If memory key is set, retrieve messages stored in history
        if (propsValue.memoryKey) {
            messageHistory = (await store.get(propsValue.memoryKey, StoreScope.PROJECT)) ?? [];
        }

        // Add user prompt to message history
        messageHistory.push({
            role: 'user',
            content: propsValue.prompt,
        });

        // Add system instructions if set by user
        const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
        const roles = rolesArray.map((item: any) => {
            const rolesEnum = ['system', 'user', 'assistant'];
            if (!rolesEnum.includes(item.role)) {
                throw new Error(
                    'The only available roles are: [system, user, assistant]'
                );
            }

            return {
                role: item.role,
                content: item.content,
            };
        });

        const completion = await openai.getChatCompletions(propsValue.deploymentId, [...roles, ...messageHistory], {
            maxTokens: propsValue.maxTokens,
            temperature: propsValue.temperature,
            frequencyPenalty: propsValue.frequencyPenalty,
            presencePenalty: propsValue.presencePenalty,
            topP: propsValue.topP,
        });

        const responseText = completion.choices[0].message?.content;

        // Add response to message history
        messageHistory = [...messageHistory, responseText];

        // Check message history token size
        // System limit is 32K tokens, we can probably make it bigger but this is a safe spot
        const tokenLength = await calculateMessagesTokenSize(messageHistory, '');
        if (propsValue.memoryKey) {
            // If tokens exceed 90% system limit or 90% of model limit - maxTokens, reduce history token size
            if (exceedsHistoryLimit(tokenLength, '', propsValue.maxTokens)) {
                messageHistory = await reduceContextSize(
                    messageHistory,
                    '',
                    propsValue.maxTokens
                );
            }
            // Store history
            await store.put(propsValue.memoryKey, messageHistory, StoreScope.PROJECT);
        }

        return responseText;
    },
});
