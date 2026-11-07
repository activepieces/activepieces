import { azureOpenaiAuth } from '../auth';
import {
    MarkdownVariant,
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { OpenAIClient, AzureKeyCredential, ChatRequestMessage } from '@azure/openai';
import { calculateMessagesTokenSize, exceedsHistoryLimit, reduceContextSize } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const askGpt = createAction({
  audience: 'both',
    auth: azureOpenaiAuth,
    name: 'ask_gpt',
    classification: 'READ',
    displayName: 'Ask GPT',
    description: 'Send a question or instruction to Azure OpenAI and get a text reply.',
    aiMetadata: { description: 'Sends a prompt to a chat model deployed on your own Azure OpenAI resource and returns the generated answer text; leave the memory key empty for a stateless one-off question, or set one to share a conversation history across runs and flows so follow-up turns keep context. Requires the Azure deployment name (your own deployment, not a public model id) and a max-tokens value, so pick this only when the workflow must run through Azure OpenAI rather than the vendor-hosted OpenAI, Anthropic, or Google Gemini pieces. Not idempotent: every call is a fresh non-deterministic billed completion, and it appends to the stored history whenever a memory key is set.', idempotent: false },
    props: {
        deploymentId: Property.ShortText({
            displayName: 'Deployment Name',
            description: 'Find it under Deployments in Azure AI Foundry. Not the model name.',
            placeholder: 'e.g. gpt-4o-prod',
            width: 'half',
            required: true,
        }),
        maxTokens: Property.Number({
            displayName: 'Maximum Tokens',
            required: true,
            description: 'Longest reply in tokens, about 4 characters each.',
            width: 'half',
            defaultValue: 2048,
        }),
        prompt: Property.LongText({
            displayName: 'Question',
            description: 'What you want the model to answer or do.',
            placeholder: 'e.g. Summarize this email in three bullet points',
            required: true,
        }),
        memoryKey: Property.ShortText({
            displayName: 'Conversation Memory ID',
            description: 'Runs that share this ID continue one conversation. Empty: no memory.',
            placeholder: 'e.g. support-chat-42',
            required: false,
        }),
        memoryInfo: Property.MarkDown({
            value: 'Saved for the whole project, so other flows that use this ID join the same conversation.',
            variant: MarkdownVariant.INFO,
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            required: false,
            description: 'From 0 to 2. Lower is more focused, higher is more varied.',
            defaultValue: 0.9,
            advanced: true,
        }),
        topP: Property.Number({
            displayName: 'Top P',
            required: false,
            description: 'From 0 to 1. Adjust this or Temperature, not both.',
            defaultValue: 1,
            advanced: true,
        }),
        frequencyPenalty: Property.Number({
            displayName: 'Frequency Penalty',
            required: false,
            description: 'From -2 to 2. Higher values make repeated lines less likely.',
            defaultValue: 0,
            advanced: true,
        }),
        presencePenalty: Property.Number({
            displayName: 'Presence Penalty',
            required: false,
            description: 'From -2 to 2. Higher values steer the reply toward new topics.',
            defaultValue: 0.6,
            advanced: true,
        }),
        roles: Property.Json({
            displayName: 'Roles',
            required: false,
            description: 'Messages sent before the question, such as a system instruction.',
            defaultValue: [
                { role: 'system', content: 'You are a helpful assistant.' },
            ],
            advanced: true,
        }),
    },
    propertyGroups: [
        { key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['deploymentId', 'maxTokens'] },
        { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['prompt'] },
        { key: 'history', display: 'section', label: 'History', icon: 'inbox', props: ['memoryKey', 'memoryInfo'] },
    ],

    async run(context) {
        const { propsValue, store } = context;
        const auth = context.auth.props;

        await propsValidation.validateZod(propsValue, {
            temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
            frequencyPenalty: z.optional(z.number().check(z.minimum(-2.0), z.maximum(2.0))),
            presencePenalty: z.optional(z.number().check(z.minimum(-2.0), z.maximum(2.0))),
        });

        const openai = new OpenAIClient(
            auth.endpoint,
            new AzureKeyCredential(auth.apiKey),
            {
                apiVersion: '2024-12-01-preview',
            }
        );

        let messageHistory: any[] = [];
        if (propsValue.memoryKey) {
            const storedHistory = await store.get(propsValue.memoryKey, StoreScope.PROJECT);
            messageHistory = Array.isArray(storedHistory) ? storedHistory.flatMap((item: unknown) => normalizeHistoryItem({ item })) : [];
        }

        messageHistory.push({
            role: 'user',
            content: propsValue.prompt,
        });

        const roles = parseRoles({ value: propsValue.roles });
        const requestMessages = [...roles, ...messageHistory].map((item: unknown) => toRequestMessage({ item }));

        const completionOptions = {
            maxCompletionTokens: propsValue.maxTokens,
            temperature: propsValue.temperature,
            frequencyPenalty: propsValue.frequencyPenalty,
            presencePenalty: propsValue.presencePenalty,
            topP: propsValue.topP,
        };

        const completion = await openai.getChatCompletions(propsValue.deploymentId, requestMessages, completionOptions);

        const choice = completion.choices[0];
        if (!choice) {
            throw new Error('Azure OpenAI returned no reply. Check the deployment name and try again.');
        }
        const responseText = choice.message?.content;

        const assistantMessage: ChatMessage = { role: 'assistant', content: responseText ?? '' };
        messageHistory = [...messageHistory, assistantMessage];

        const tokenLength = await calculateMessagesTokenSize(messageHistory, '');
        if (propsValue.memoryKey) {
            if (exceedsHistoryLimit(tokenLength, '', propsValue.maxTokens)) {
                messageHistory = await reduceContextSize(
                    messageHistory,
                    '',
                    propsValue.maxTokens
                );
            }
            await store.put(propsValue.memoryKey, messageHistory, StoreScope.PROJECT);
        }

        return responseText;
    },
});

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRawMessage(value: unknown): value is RawMessage {
    return isRecord(value);
}

function toContentText({ value }: { value: unknown }): string {
    if (typeof value === 'string') {
        return value;
    }
    if (value === undefined || value === null) {
        return '';
    }
    return JSON.stringify(value);
}

function normalizeHistoryItem({ item }: { item: unknown }): unknown[] {
    if (typeof item === 'string') {
        return [{ role: 'assistant', content: item }];
    }
    if (typeof item !== 'object' || item === null) {
        return [];
    }
    return [item];
}

function parseRoles({ value }: { value: unknown }): Record<string, unknown>[] {
    if (value === undefined || value === null || value === '') {
        return [];
    }
    if (isRecord(value) && Object.keys(value).length === 0) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error('Roles must be a JSON array of { role, content } objects.');
    }
    return value.map((item: unknown) => {
        if (!isRecord(item)) {
            throw new Error('Roles must be a JSON array of { role, content } objects.');
        }
        return item;
    });
}

function toRequestMessage({ item }: { item: unknown }): ChatRequestMessage {
    const rolesEnum = ['system', 'user', 'assistant'];
    if (!isRawMessage(item) || typeof item.role !== 'string' || !rolesEnum.includes(item.role)) {
        throw new Error(
            'The only available roles are: [system, user, assistant]'
        );
    }
    const content = toContentText({ value: item.content });
    if (item.role === 'system') {
        return { role: 'system', content };
    }
    if (item.role === 'user') {
        return { role: 'user', content };
    }
    return { role: 'assistant', content };
}

type ChatMessage = { role: string; content: string };
type RawMessage = { role?: unknown; content?: unknown };
