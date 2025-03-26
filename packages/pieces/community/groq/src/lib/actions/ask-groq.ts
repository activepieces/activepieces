import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { groqAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const askGroq = createAction({
	auth: groqAuth,
	name: 'ask-ai',
	displayName: 'Ask AI',
	description: 'Ask Groq anything using fast language models.',
	props: {
		model: Property.Dropdown({
			displayName: 'Model',
			required: true,
			description: 'The model which will generate the completion.',
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
							token: auth as string,
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
						placeholder: "Couldn't load models, API key is invalid",
					};
				}
			},
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
				"The maximum number of tokens to generate. The total length of input tokens and generated tokens is limited by the model's context length.",
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
				"Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.",
			defaultValue: 0.6,
		}),
		memoryKey: Property.ShortText({
			displayName: 'Memory Key',
			description:
				'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave Groq without memory of previous messages.',
			required: false,
		}),
		roles: Property.Json({
			displayName: 'Roles',
			required: false,
			description: 'Array of roles to specify more accurate response',
			defaultValue: [{ role: 'system', content: 'You are a helpful assistant.' }],
		}),
	},
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
				token: auth,
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
