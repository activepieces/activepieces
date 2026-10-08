import { DropdownState, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../auth';
import { imageRouterApi } from './api';

function model<R extends boolean>({
	required,
	displayName = 'Model',
	description = 'Select an image generation model',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: imageRouterAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Please connect your account first' });
			}

			try {
				const response = await imageRouterApi.listImageModels({ auth });

				const models = Object.entries(response).map(([modelId, modelData]) => {
					const provider = modelData.providers?.[0]?.id || modelData.providers?.[0]?.name || '';
					const modelName = modelId.split('/').pop() || modelId;

					const isFree =
						modelId.includes(':free') ||
						modelData.providers?.some(
							(p) =>
								p.pricing?.value === 0 || (p.pricing?.type === 'fixed' && p.pricing?.value === 0),
						) ||
						false;

					const nameLower = modelName.toLowerCase();
					const isFast =
						nameLower.includes('fast') ||
						nameLower.includes('turbo') ||
						nameLower.includes('schnell') ||
						nameLower.includes('flash') ||
						nameLower.includes('lightning') ||
						nameLower.includes('mini');

					const isPremium =
						nameLower.includes('pro') ||
						nameLower.includes('ultra') ||
						nameLower.includes('max') ||
						nameLower.includes('quality');

					let category = '';
					if (isFree) {
						category = 'Free';
					} else if (isFast) {
						category = 'Fast';
					} else if (isPremium) {
						category = 'Premium';
					} else {
						category = 'Standard';
					}

					return { id: modelId, name: modelName, provider, category, isFree, isFast, isPremium };
				});

				if (models.length === 0) {
					return disabledOptions({ placeholder: 'No models found' });
				}

				const sortedModels = models.sort((a, b) => {
					if (a.isFree && !b.isFree) return -1;
					if (!a.isFree && b.isFree) return 1;
					if (a.isFast && !b.isFast) return -1;
					if (!a.isFast && b.isFast) return 1;
					if (a.isPremium && !b.isPremium) return -1;
					if (!a.isPremium && b.isPremium) return 1;
					return a.name.localeCompare(b.name);
				});

				return {
					disabled: false,
					options: sortedModels.map((m) => ({
						label: m.provider
							? `[${m.category}] ${m.name} (${m.provider})`
							: `[${m.category}] ${m.name}`,
						value: m.id,
					})),
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : '';
				return disabledOptions({
					placeholder: `Failed to load models: ${message || 'Unknown error'}`,
				});
			}
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const imageRouterProps = { model };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
