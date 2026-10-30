import { createAction, MarkdownVariant, Property, StoreScope } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { groqAuth } from '../auth';
import { groqClient } from '../common/client';
import { groqProps } from '../common/props';
import type { GroqChatCompletion, GroqChatMessage } from '../common/types';
import { askAiActionOutputSchema } from '../output-schemas';

export const askAiAction = createAction({
  audience: 'both',
	auth: groqAuth,
	name: 'ask-ai',
	classification: 'READ',
	displayName: 'Ask AI',
	description: 'Send a question or instruction to a Groq model and get a text reply.',
	aiMetadata: { description: 'Sends a prompt to a Groq-hosted chat model (Whisper speech models are excluded from the model list) and returns the generated text, with optional sampling controls and a roles array for system instructions. Runs stateless by default, or shares conversation history across runs and flows when a memory key is set. This is the only text-generation action in the piece - pick the sibling Transcribe Audio or Translate Audio actions when the input is a sound file rather than text. Requires a model, a question, and a maximum token count; not idempotent: each call produces a fresh completion and, when a memory key is set, appends to the stored project-scoped history.', idempotent: false },
	propertyGroups: [
		{ key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model', 'maxTokens'] },
		{ key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['prompt'] },
		{ key: 'history', display: 'section', label: 'History', icon: 'inbox', props: ['memoryKey', 'memoryInfo'] },
	],
	props: {
		model: groqProps.chatModel({ required: true }),
		prompt: Property.LongText({
			displayName: 'Question',
			description: 'What you want the model to answer or do.',
			placeholder: 'e.g. Summarize this email in three bullet points',
			required: true,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			required: false,
			description: 'From 0 to 2. Lower is more focused, higher is more varied.',
			defaultValue: 0.9,
			advanced: true,
		}),
		maxTokens: Property.Number({
			displayName: 'Maximum Tokens',
			required: true,
			description: 'Longest reply in tokens, about 4 characters each.',
			defaultValue: 2048,
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
			description: 'From -2 to 2. Groq models do not support this yet.',
			defaultValue: 0,
			advanced: true,
		}),
		presencePenalty: Property.Number({
			displayName: 'Presence Penalty',
			required: false,
			description: 'From -2 to 2. Groq models do not support this yet.',
			defaultValue: 0.6,
			advanced: true,
		}),
		memoryKey: Property.ShortText({
			displayName: 'Conversation Memory ID',
			description: 'Runs that share this ID continue one conversation. Empty: no memory.',
			placeholder: 'e.g. support-chat-42',
			required: false,
		}),
		memoryInfo: Property.MarkDown({ value: 'Saved for the whole project, so other flows that use this ID join the same conversation.', variant: MarkdownVariant.INFO }),
		roles: Property.Json({
			displayName: 'Roles',
			required: false,
			description: 'Messages sent before the question, such as a system instruction.',
			advanced: true,
			defaultValue: [{ role: 'system', content: 'You are a helpful assistant.' }],
		}),
	},
	outputSchema: askAiActionOutputSchema,
	async run({ auth, propsValue, store }) {
		const {
			model,
			temperature,
			maxTokens,
			topP,
			frequencyPenalty,
			presencePenalty,
			prompt,
			memoryKey,
		} = propsValue;

		let messageHistory: GroqChatMessage[] = [];
		if (memoryKey) {
			messageHistory = (await store.get<GroqChatMessage[]>(memoryKey, StoreScope.PROJECT)) ?? [];
		}

		messageHistory.push({
			role: 'user',
			content: prompt,
		});

		const rolesArray = z
			.array(z.object({ role: z.string(), content: z.unknown() }))
			.parse(propsValue.roles ? propsValue.roles : []);
		const roles: GroqChatMessage[] = rolesArray.map((item) => {
			const rolesEnum = ['system', 'user', 'assistant'];
			if (!rolesEnum.includes(item.role)) {
				throw new Error('The only available roles are: [system, user, assistant]');
			}

			return {
				role: item.role,
				content: item.content,
			};
		});

		const completion = await groqClient.request<GroqChatCompletion>({
			auth,
			method: HttpMethod.POST,
			path: '/chat/completions',
			body: {
				model: model,
				messages: [...roles, ...messageHistory],
				temperature: temperature,
				top_p: topP,
				frequency_penalty: frequencyPenalty,
				presence_penalty: presencePenalty,
				max_completion_tokens: maxTokens,
			},
		});

		messageHistory = [...messageHistory, completion.choices[0].message];

		if (memoryKey) {
			await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
		}

		const rawContent = completion.choices[0].message.content;
		const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);

		if (thinkMatch) {
			return [
				{
					Think: thinkMatch[1].trim(),
					Content: rawContent.split('</think>').pop()?.trim() || '',
				},
			];
		}

		return [
			{
				Think: null,
				Content: rawContent,
			},
		];
	},
});
