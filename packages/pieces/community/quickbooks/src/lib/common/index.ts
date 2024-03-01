import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { QuickBooksAPIClient } from './client';
import { quickBooksAuth } from '../../';

export const quickBooksCommon = {
	customerId: (required = false, displayName: string, description: string = '') =>
		Property.Dropdown({
			displayName,
			description,
			refreshers: [],
			required,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof quickBooksAuth>;

				const client = new QuickBooksAPIClient({
					accessToken: authValue.access_token,
					companyId: authValue.props?.['companyId'],
				});

				const response = await client.customers.query({
					query: 'select * from Customer orderby MetaData.LastUpdatedTime desc',
				});

				return {
					disabled: false,
					options: response.QueryResponse.Customer.map((customer) => {
						return {
							label: customer.DisplayName,
							value: customer.Id,
						};
					}),
				};
			},
		}),
	itemId: Property.Dropdown({
		displayName: 'Product/Service',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof quickBooksAuth>;

			const client = new QuickBooksAPIClient({
				accessToken: authValue.access_token,
				companyId: authValue.props?.['companyId'],
			});

			const response = await client.items.query({
				query: 'select * from Item orderby MetaData.LastUpdatedTime desc',
			});

			return {
				disabled: false,
				options: response.QueryResponse.Item.map((item) => {
					return {
						label: item.Name,
						value: item.Id,
					};
				}),
			};
		},
	}),
	paymentMethodId: (required = false, displayName: string, description: string = '') =>
		Property.Dropdown({
			displayName,
			description,
			refreshers: [],
			required,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof quickBooksAuth>;

				const client = new QuickBooksAPIClient({
					accessToken: authValue.access_token,
					companyId: authValue.props?.['companyId'],
				});

				const response = await client.paymentmethods.query({
					query: 'select * from PaymentMethod orderby MetaData.LastUpdatedTime desc',
				});

				return {
					disabled: false,
					options: response.QueryResponse.PaymentMethod.map((method) => {
						return {
							label: method.Name,
							value: method.Id,
						};
					}),
				};
			},
		}),
	termId: (required = false, displayName: string, description: string = '') =>
		Property.Dropdown({
			displayName,
			description,
			refreshers: [],
			required,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof quickBooksAuth>;

				const client = new QuickBooksAPIClient({
					accessToken: authValue.access_token,
					companyId: authValue.props?.['companyId'],
				});

				const response = await client.terms.query({
					query: 'select * from Term orderby MetaData.LastUpdatedTime desc',
				});

				return {
					disabled: false,
					options: response.QueryResponse.Term.map((term) => {
						return {
							label: term.Name,
							value: term.Id,
						};
					}),
				};
			},
		}),
	companyCurrencyId: (required = false, displayName: string, description: string = '') =>
		Property.Dropdown({
			displayName,
			description,
			refreshers: [],
			required,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof quickBooksAuth>;

				const client = new QuickBooksAPIClient({
					accessToken: authValue.access_token,
					companyId: authValue.props?.['companyId'],
				});

				const response = await client.companycurrencies.query({
					query: 'select * from companycurrency orderby MetaData.LastUpdatedTime desc',
				});

				return {
					disabled: false,
					options: response.QueryResponse.CompanyCurrency.map((currency) => {
						return {
							label: currency.Name,
							value: currency.Code,
						};
					}),
				};
			},
		}),
};
