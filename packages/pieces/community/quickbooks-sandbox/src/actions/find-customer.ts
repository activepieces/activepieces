import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';

export const findCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'find_customer',
	displayName: 'Find Customer',
	description: 'Search for a customer by display name in QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Look up a single QuickBooks customer by exact display name, returning the first match. Use to resolve a customer name to its full record (including its Id) before referencing it elsewhere; the match is exact, not fuzzy. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		search_term: Property.ShortText({
			displayName: 'Customer Name',
			description: 'The display name of the customer to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { search_term } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const query = `SELECT * FROM Customer WHERE DisplayName = '${search_term.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/customer#query-a-customer
		const response = await quickbooksQuery<QuickbooksEntityResponse<QuickBooksCustomer>>({
			accessToken: context.auth.access_token,
			companyId: companyId as string,
			query,
		});

		if (
			response?.QueryResponse?.['Customer'] &&
			response.QueryResponse['Customer'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse['Customer'][0],
			};
		}

		return {
			found: false,
			result: {},
		};
	},
});

interface QuickBooksCustomer {
	Id: string;
	SyncToken: string;
	MetaData?: {
		CreateTime: string;
		LastUpdatedTime: string;
	};
	GivenName?: string;
	FamilyName?: string;
	FullyQualifiedName?: string;
	CompanyName?: string;
	DisplayName: string;
	PrintOnCheckName?: string;
	Active?: boolean;
	PrimaryPhone?: {
		FreeFormNumber: string;
	};
	PrimaryEmailAddr?: {
		Address: string;
	};
	BillAddr?: QuickBooksAddress;
	ShipAddr?: QuickBooksAddress;
	Notes?: string;
	Job?: boolean;
	BillWithParent?: boolean;
	ParentRef?: QuickBooksRef;
	Level?: number;
	Taxable?: boolean;
	Balance?: number;
	BalanceWithJobs?: number;
	CurrencyRef?: QuickBooksRef;
	PreferredDeliveryMethod?: string;
	PaymentMethodRef?: QuickBooksRef;
	domain?: string;
	sparse?: boolean;
}

interface QuickBooksAddress {
	Id?: string;
	Line1?: string;
	Line2?: string;
	Line3?: string;
	Line4?: string;
	Line5?: string;
	City?: string;
	Country?: string;
	CountrySubDivisionCode?: string;
	PostalCode?: string;
	Lat?: string;
	Long?: string;
	Tag?: string;
	PostalCodeSuffix?: string;
}

interface QuickBooksRef {
	value: string;
	name?: string;
}
