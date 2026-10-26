import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from './auth';
import { mistralRequest } from './request';
import { mistralApi } from './client';

export const modelDropdown = Property.Dropdown({
	displayName: 'Model',
	description: 'The Mistral model that writes the reply.',
	required: true,
	refreshers: [],
	auth: mistralAuth,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first.',
				options: [],
			};
		}
		try {
			const { baseUrl, headers } = mistralRequest.getConfig(auth);
			const response = await httpClient.sendRequest<{ data: { id: string; name: string }[] }>({
				method: HttpMethod.GET,
				url: `${baseUrl}/models`,
				headers,
			});
			const models = response.body.data || [];
			const options: DropdownOption<string>[] = models.map((model) => ({
				label: model.name || model.id,
				value: model.id,
			}));
			if (options.length === 0) {
				return {
					disabled: true,
					placeholder: 'No models found for your account.',
					options: [],
				};
			}
			return {
				disabled: false,
				options,
			};
		} catch {
			return {
				disabled: true,
				placeholder: 'Failed to load models. Check your API key and network.',
				options: [],
			};
		}
	},
});

export function parseMistralError({ error, baseUrl }: { error: unknown; baseUrl: string }): string {
	return mistralApi.describeError({ error, isGateway: mistralApi.isGatewayBaseUrl(baseUrl) });
}
