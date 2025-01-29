import { HttpMethod } from '@activepieces/pieces-common';
import { confluencePaginatedApiCall } from '.';
import { confluenceAuth } from '../../index';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

export const spaceIdProp = Property.Dropdown({
	displayName: 'Space',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const authValue = auth as PiecePropValueSchema<typeof confluenceAuth>;
		const spaces = await confluencePaginatedApiCall<{ id: string; name: string }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			method: HttpMethod.GET,
			resourceUri: '/spaces',
		});

		const options: DropdownOption<string>[] = [];
		for (const space of spaces) {
			options.push({
				label: space.name,
				value: space.id,
			});
		}
		return {
			disabled: false,
			options,
		};
	},
});
