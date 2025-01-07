import { HttpMethod } from '@activepieces/pieces-common';
import { pipedrivePaginatedApiCall } from '.';
import { pipedriveAuth } from '../../index';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

export const ownerIdDropdown = (required: boolean) =>
	Property.Dropdown({
		displayName: 'Owner',
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
			const users = await pipedrivePaginatedApiCall<Record<string, any>>({
				accessToken: authValue.access_token,
				apiDomain: authValue.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/users',
				query: {
					sort: 'update_time DESC',
				},
			});

			const options: DropdownOption<number>[] = [];
			for (const user of users) {
				options.push({
					label: user.email,
					value: user.id,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});
