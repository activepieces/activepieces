import { DropdownState, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from './api';
import type {
	QuickbooksAccount,
	QuickbooksAuthValue,
	QuickbooksCustomer,
	QuickbooksEntityResponse,
	QuickbooksFault,
	QuickbooksTerm,
	QuickbooksVendor,
} from './types';

function customerRef<R extends boolean>({ required, displayName = 'Customer', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your account first' });
			}
			const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksCustomer>>({
				auth,
				query: `SELECT Id, DisplayName FROM Customer STARTPOSITION 1 MAXRESULTS 1000`,
			});

			if (response.Fault) {
				throw new Error(`QuickBooks API Error: ${faultMessages({ fault: response.Fault })}`);
			}

			const customers = response.QueryResponse?.['Customer'] ?? [];
			return {
				disabled: false,
				options: customers.map((customer) => ({
					label: customer.DisplayName,
					value: customer.Id,
				})),
			};
		},
	});
}

function vendorRef<R extends boolean>({ required, displayName = 'Vendor', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your account first' });
			}
			const response = await listVendors({ auth });

			if (response.Fault) {
				throw new Error(`QuickBooks API Error fetching vendors: ${faultMessages({ fault: response.Fault })}`);
			}

			return vendorOptions({ response });
		},
	});
}

function entityRef<R extends boolean>({
	required,
	displayName = 'Payee (Vendor)',
	description = 'Optional - The vendor the expense was paid to.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect account' });
			}
			const response = await listVendors({ auth });

			if (response.Fault) {
				throw new Error(`QuickBooks API Error fetching vendors: ${faultMessages({ fault: response.Fault })}`);
			}

			return vendorOptions({ response });
		},
	});
}

function billPaymentVendorRef<R extends boolean>({ required, displayName = 'Vendor', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your account first' });
			}
			const response = await listVendors({ auth });

			if (response.Fault) {
				return disabledOptions({ placeholder: 'Unable to load vendors' });
			}

			return vendorOptions({ response });
		},
	});
}

function accountRef<R extends boolean>({
	required,
	displayName = 'Bank/Credit Card Account',
	description = 'The account from which the expense was paid.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect account' });
			}
			const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksAccount>>({
				auth,
				query: `SELECT Id, Name, AccountType FROM Account STARTPOSITION 1 MAXRESULTS 1000`,
			});

			if (response.Fault) {
				throw new Error(`QuickBooks API Error fetching accounts: ${faultMessages({ fault: response.Fault })}`);
			}

			const accounts = response.QueryResponse?.['Account'] ?? [];
			return {
				disabled: false,
				options: accounts.map((account) => ({
					label: `${account.Name} (${account.AccountType})`,
					value: account.Id,
				})),
			};
		},
	});
}

function payFromAccountRef<R extends boolean>({
	required,
	displayName = 'Pay From Account',
	description = 'The checking/savings account (for Check) or credit card account (for Credit Card) the payment is made from.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: ['payType'],
		options: async ({ auth, payType }) => {
			if (!auth || !payType) {
				return disabledOptions({ placeholder: 'Select a pay-with method first' });
			}
			const accountType = payType === 'CreditCard' ? 'Credit Card' : 'Bank';
			const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksAccount>>({
				auth,
				query: `SELECT Id, Name, AccountType FROM Account WHERE AccountType = '${accountType}' AND Active = true MAXRESULTS 1000`,
			});

			if (response.Fault) {
				return disabledOptions({ placeholder: 'Unable to load accounts' });
			}

			const accounts = response.QueryResponse?.['Account'] ?? [];
			return {
				disabled: false,
				options: accounts.map((account) => ({
					label: account.Name,
					value: account.Id,
				})),
			};
		},
	});
}

function termRef<R extends boolean>({
	required,
	displayName = 'Payment Term',
	description = 'Optional. The default payment term for bills from this vendor.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: quickbooksAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your account first' });
			}
			const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksTerm>>({
				auth,
				query: `SELECT Id, Name FROM Term MAXRESULTS 1000`,
			});

			if (response.Fault) {
				return disabledOptions({ placeholder: 'Unable to load payment terms' });
			}

			const terms = response.QueryResponse?.['Term'] ?? [];
			return {
				disabled: false,
				options: terms.map((term) => ({ label: term.Name, value: term.Id })),
			};
		},
	});
}

async function listVendors({ auth }: { auth: QuickbooksAuthValue }): Promise<QuickbooksEntityResponse<QuickbooksVendor>> {
	return await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksVendor>>({
		auth,
		query: `SELECT Id, DisplayName FROM Vendor STARTPOSITION 1 MAXRESULTS 1000`,
	});
}

function vendorOptions({ response }: { response: QuickbooksEntityResponse<QuickbooksVendor> }): DropdownState<string> {
	const vendors = response.QueryResponse?.['Vendor'] ?? [];
	return {
		disabled: false,
		options: vendors.map((vendor) => ({
			label: vendor.DisplayName,
			value: vendor.Id,
		})),
	};
}

function faultMessages({ fault }: { fault: QuickbooksFault }): string {
	return fault.Error.map((e) => e.Message).join(', ');
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const quickbooksProps = {
	customerRef,
	vendorRef,
	entityRef,
	billPaymentVendorRef,
	accountRef,
	payFromAccountRef,
	termRef,
};

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
