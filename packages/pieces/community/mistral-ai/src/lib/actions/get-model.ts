import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { getModelOutputSchema } from '../output-schemas';

export const getModel = createAction({
	auth: mistralAuth,
	name: 'get_model',
	classification: 'READ',
	displayName: 'Get Model',
	description: 'Get details and capabilities of one Mistral model.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one model’s details by id: capabilities (chat, function calling, vision, fine-tuning, OCR, audio), context length, aliases, owner and deprecation date. Use it to check what a model supports before calling it; use List Models to discover ids. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getModelOutputSchema,
	props: {
		model_id: Property.ShortText({
			displayName: 'Model ID',
			description: 'The model id, e.g. mistral-large-latest or a fine-tuned id starting with ft:.',
			required: true,
		}),
	},
	async run(context) {
		const model = await mistralApi.call<ModelCard>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/models/${encodeURIComponent(context.propsValue.model_id)}`,
		});
		return {
			id: model.id,
			name: model.name ?? null,
			description: model.description ?? null,
			type: model.type ?? null,
			owned_by: model.owned_by ?? null,
			created: model.created ?? null,
			max_context_length: model.max_context_length ?? null,
			aliases: model.aliases ?? [],
			deprecation: model.deprecation ?? null,
			default_model_temperature: model.default_model_temperature ?? null,
			capabilities: model.capabilities ?? {},
		};
	},
});

type ModelCard = {
	id: string;
	name?: string | null;
	description?: string | null;
	type?: string;
	owned_by?: string;
	created?: number;
	max_context_length?: number;
	aliases?: string[];
	deprecation?: string | null;
	default_model_temperature?: number | null;
	capabilities?: Record<string, boolean>;
};
