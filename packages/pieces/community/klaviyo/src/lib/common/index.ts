import { klaviyoAuth } from '../auth';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { KlaviyoClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof klaviyoAuth>) {
	const client = new KlaviyoClient(auth.apiKey);
	return client;
}

export const klaviyoCommon = {
	listId: (required = false) =>
		Property.Dropdown({
			auth: klaviyoAuth,
			displayName: 'List',
			required,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first',
						options: [],
					};
				}
				const client = makeClient(auth.props);
				const res = await client.listLists();

				return {
					disabled: false,
					options: res.data.map((list: any) => {
						return {
							label: list.attributes.name,
							value: list.id,
						};
					}),
				};
			},
		}),
};
