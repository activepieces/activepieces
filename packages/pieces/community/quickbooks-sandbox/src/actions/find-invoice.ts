import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';

interface QuickBooksRef {
	value: string;
	name?: string;
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

interface QuickBooksCustomField {
	DefinitionId: string;
	Name?: string;
	Type: string;
	StringValue?: string;
}

interface QuickBooksLinkedTxn {
	TxnId: string;
	TxnType: string;
}

interface QuickBooksTaxLineDetail {
	NetAmountTaxable?: number;
	TaxPercent?: number;
	TaxRateRef?: QuickBooksRef;
	PercentBased?: boolean;
}

interface QuickBooksTaxLine {
	DetailType: string;
	Amount?: number;
	TaxLineDetail?: QuickBooksTaxLineDetail;
}

interface QuickBooksInvoice {
	Id: string;
	SyncToken: string;
	MetaData?: {
		CreateTime: string;
		LastUpdatedTime: string;
	};
	CustomField?: QuickBooksCustomField[];
	DocNumber?: string;
	TxnDate?: string;
	domain?: string;
	sparse?: boolean;
	CustomerRef: QuickBooksRef;
	ProjectRef?: QuickBooksRef;
	SalesTermRef?: QuickBooksRef;
	BillEmail?: {
		Address: string;
	};
	TotalAmt?: number;
	CurrencyRef?: QuickBooksRef;
	LinkedTxn?: QuickBooksLinkedTxn[];
	Line: QuickBooksInvoiceLine[];
	TxnTaxDetail?: {
		TxnTaxCodeRef?: QuickBooksRef;
		TotalTax?: number;
		TaxLine?: QuickBooksTaxLine[];
	};
	DueDate?: string;
	Balance?: number;
	Deposit?: number;
	ApplyTaxAfterDiscount?: boolean;
	PrintStatus?: string;
	EmailStatus?: string;
	ShipAddr?: QuickBooksAddress;
	BillAddr?: QuickBooksAddress;
	CustomerMemo?: { value: string };
}

interface QuickBooksInvoiceLine {
	Id?: string;
	LineNum?: number;
	Description?: string;
	Amount: number;
	DetailType: string;
	SalesItemLineDetail?: {
		ItemRef: QuickBooksRef;
		TaxCodeRef?: QuickBooksRef;
		UnitPrice?: number;
		Qty?: number;
	};
	SubTotalLineDetail?: {
		ItemRef?: QuickBooksRef;
	};
}

export const findInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'find_invoice',
	displayName: 'Find Invoice',
	description: 'Search for an invoice by its number in QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Look up a single QuickBooks invoice by its document number (DocNumber), returning the first match. Use to resolve an invoice reference to its full record before reading or acting on it; the document number is required. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		invoice_number: Property.ShortText({
			displayName: 'Invoice Number',
			description: 'The document number (DocNumber) of the invoice to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { invoice_number } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const query = `SELECT * FROM Invoice WHERE DocNumber = '${invoice_number.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice#query-an-invoice
		const response = await quickbooksQuery<QuickbooksEntityResponse<QuickBooksInvoice>>({
			accessToken: context.auth.access_token,
			companyId: companyId as string,
			query,
		});

		if (
			response?.QueryResponse?.['Invoice'] &&
			response.QueryResponse['Invoice'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse['Invoice'][0],
			};
		}

		return {
			found: false,
			result: {},
		};
	},
});
