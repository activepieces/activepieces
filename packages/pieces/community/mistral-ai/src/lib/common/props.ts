import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

export const modelDropdown = Property.Dropdown({
	displayName: 'Model',
	description: 'Select a Mistral model. List is fetched live from your account.',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first.',
				options: [],
			};
		}
		try {
			const response = await httpClient.sendRequest<{data:{id:string,name:string}[]}>({
				method: HttpMethod.GET,
				url: 'https://api.mistral.ai/v1/models',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth as string,
				},
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

export function parseMistralError(e: any): string {
	if (e.response?.data?.error) return e.response.data.error;
	if (e.response?.data?.message) return e.response.data.message;
	if (e.message) return e.message;
	return 'Unknown error';
}