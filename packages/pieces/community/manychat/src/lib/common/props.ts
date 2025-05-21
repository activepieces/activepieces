import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.manychat.com/fb';

export const subscriberId = Property.Number({
	displayName: 'User ID',
	description: `Please refer [Manychat Guide](https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters#h_01JCR55RJ0B0PQW6HDW6RW0A42) to obtain user/contact ID.`,
	required: true,
});

export const tagIdDropdown = Property.Dropdown({
	displayName: 'Tag',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				placeholder: 'Please connect your account.',
				disabled: true,
				options: [],
			};
		}

		const response = await httpClient.sendRequest<{ data: Array<{ id: number; name: string }> }>({
			url: `${BASE_URL}/page/getTags`,
			method: HttpMethod.GET,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth as string,
			},
		});

		return {
			disabled: false,
			options: response.body.data.map((tag) => ({
				label: tag.name,
				value: tag.id,
			})),
		};
	},
});

