import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { groqAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { askAiActionOutputSchema } from '../output-schemas';

export const askGroq = createAction({
  audience: 'both',
	auth: groqAuth,
	name: 'ask-ai',
	classification: 'READ',
	displayName: 'Ask AI',
	description: 'Send a question or instruction to a Groq model and get a text reply.',
	aiMetadata: { description: 'Sends a prompt to a Groq-hosted chat model (Whisper speech models are excluded from the model list) and returns the generated text, with optional sampling controls and a roles array for system instructions. Runs stateless by default, or shares conversation history across runs and flows when a memory key is set. This is the only text-generation action in the piece - pick the sibling Transcribe Audio or Translate Audio actions when the input is a sound file rather than text. Requires a model, a question, and a maximum token count; not idempotent: each call produces a fresh completion and, when a memory key is set, appends to the stored project-scoped history.', idempotent: false },
	props: {
		model: Property.Dropdown({
			auth: groqAuth,
			displayName: 'Model',
			required: true,
			description: 'Speech models are left out; use the audio actions for them.',
			refreshers: [],
			defaultValue: 'llama-3.1-70b-versatile',
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your Groq account first.',
						options: [],
					};
				}
				try {
					const response = await httpClient.sendRequest({
						url: 'https://api.groq.com/openai/v1/models',
						method: HttpMethod.GET,
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: auth.secret_text,
						},
					});
					// Filter out audio models
					const models = (response.body.data as Array<{ id: string }>).filter(
						(model) => !model.id.toLowerCase().includes('whisper'),
					);
					return {
						disabled: false,
						options: models.map((model) => {
							return {
								label: model.id,
								value: model.id,
							};
						}),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
						placeholder: "Couldn't load models. Check your API key or try again.",
					};
				}
			},
		}),
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

		let messageHistory: any[] | null = [];
		// If memory key is set, retrieve messages stored in history
		if (memoryKey) {
			messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
		}

		// Add user prompt to message history
		messageHistory.push({
			role: 'user',
			content: prompt,
		});

		// Add system instructions if set by user
		const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
		const roles = rolesArray.map((item: any) => {
			const rolesEnum = ['system', 'user', 'assistant'];
			if (!rolesEnum.includes(item.role)) {
				throw new Error('The only available roles are: [system, user, assistant]');
			}

			return {
				role: item.role,
				content: item.content,
			};
		});

		// Send prompt
		const completion = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.groq.com/openai/v1/chat/completions',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.secret_text,
			},
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

		// Add response to message history
		messageHistory = [...messageHistory, completion.body.choices[0].message];

		// Store history if memory key is set
		if (memoryKey) {
			await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
		}

		// Get the raw content from the response
		const rawContent = completion.body.choices[0].message.content;
		
		// Check if the response contains thinking (content inside <think> tags)
		const thinkRegex = /<think>([\s\S]*?)<\/think>/;
		const thinkMatch = rawContent.match(thinkRegex);
		
		// Create the response structure
		const responseStructure = [];
		
		if (thinkMatch) {
			// Extract the thinking content
			const thinkContent = thinkMatch[1].trim();
			
			// Extract the final answer (content after the last </think> tag)
			const finalContent = rawContent.split('</think>').pop()?.trim() || '';
			
			// Add to response structure
			responseStructure.push({
				Think: thinkContent,
				Content: finalContent
			});
		} else {
			// If no thinking tags, just return the content as is
			responseStructure.push({
				Think: null,
				Content: rawContent
			});
		}
		
		return responseStructure;
	},
});
