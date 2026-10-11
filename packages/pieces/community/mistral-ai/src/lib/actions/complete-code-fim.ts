import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { completeCodeFimOutputSchema } from '../output-schemas';

export const completeCodeFim = createAction({
	auth: mistralAuth,
	name: 'complete_code_fim',
	classification: 'READ',
	displayName: 'Complete Code (Fill-in-the-Middle)',
	description: 'Generate the code that belongs between a prefix and an optional suffix with a Codestral model.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fills in code between a prefix (prompt) and an optional suffix using a Codestral fill-in-the-middle model, returning only the generated middle text. Pick this for code insertion or completion inside an existing file; use Generate Chat Completion for explaining or writing code from an instruction. Only Codestral models support this endpoint. Not idempotent: each call bills a new completion.',
		idempotent: false,
	},
	outputSchema: completeCodeFimOutputSchema,
	props: {
		model: Property.ShortText({
			displayName: 'Model',
			description: 'A Codestral model id. Fill-in-the-middle only works with Codestral models.',
			required: true,
			defaultValue: 'codestral-latest',
		}),
		prompt: Property.LongText({
			displayName: 'Code Before (Prompt)',
			description: 'The code that comes before the part to generate.',
			required: true,
		}),
		suffix: Property.LongText({
			displayName: 'Code After (Suffix)',
			description: 'Optional code that comes after the part to generate.',
			required: false,
		}),
		max_tokens: Property.Number({ displayName: 'Max Tokens', required: false }),
		temperature: Property.Number({ displayName: 'Temperature', required: false }),
		stop: Property.Array({
			displayName: 'Stop Sequences',
			description: 'Stop generating when any of these strings is produced.',
			required: false,
		}),
	},
	async run(context) {
		const { model, prompt, suffix, max_tokens, temperature, stop } = context.propsValue;
		const stopSequences = mistralApi.toStringArray(stop);
		const response = await mistralApi.call<FimResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/fim/completions',
			body: mistralApi.compact({
				model,
				prompt,
				suffix,
				max_tokens,
				temperature,
				stop: stopSequences.length > 0 ? stopSequences : undefined,
			}),
			timeout: 120000,
		});
		const choice = response.choices[0];
		return {
			id: response.id,
			model: response.model,
			completion: mistralApi.contentToText(choice?.message?.content),
			finish_reason: choice?.finish_reason ?? null,
			prompt_tokens: response.usage?.prompt_tokens ?? null,
			completion_tokens: response.usage?.completion_tokens ?? null,
			total_tokens: response.usage?.total_tokens ?? null,
		};
	},
});

type FimResponse = {
	id: string;
	model: string;
	choices: { finish_reason: string; message?: { content: unknown } }[];
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};
