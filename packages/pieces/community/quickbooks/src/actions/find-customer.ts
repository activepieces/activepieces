import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../index';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';

export const findCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'find_customer',
	displayName: 'Find Customer',
	description: 'Search for a customer by display name in QuickBooks.',
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

		const apiUrl = quickbooksCommon.getApiUrl(companyId);
		const query = `SELECT * FROM Customer WHERE DisplayName = '${search_term.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickBooksCustomer>>({
			method: HttpMethod.GET,
			url: `${apiUrl}/query`,
			queryParams: {
				query: query,
				minorversion: '70',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			headers: {
				Accept: 'application/json',
			},
		});

		if (
			response.body?.QueryResponse?.['Customer'] &&
			response.body.QueryResponse['Customer'].length > 0
		) {
			return {
				found: true,
				result: response.body.QueryResponse['Customer'][0],
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
