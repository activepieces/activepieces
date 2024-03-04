import { quickBooksAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { QuickBooksAPIClient } from '../../common/client';

export const findCustomerAction = createAction({
	auth: quickBooksAuth,
	name: 'quickbooks_find_customer',
	displayName: 'Find Customer',
	description: 'Find a customer by name or email address.',
	props: {
		searchField: Property.StaticDropdown({
			displayName: 'Search Field',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Customer Display Name',
						value: 'DisplayName',
					},
					{
						label: 'Email',
						value: 'PrimaryEmailAddr.Address',
					},
				],
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
		}),
	},
	async run(context) {
		const { searchField, searchValue } = context.propsValue;

		const client = new QuickBooksAPIClient({
			accessToken: context.auth.access_token,
			companyId: context.auth.props?.['companyId'],
		});

		const query = `select * from Customer where ${searchField} = '${searchValue}'`;

		return await client.customers.query({ query: escapeSepcialCharacter(query) });
	},
});

function escapeSepcialCharacter(input: string): string {
	return input.replace(/'/g, "\\'");
}
