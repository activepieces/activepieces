import { Property, createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth'; // Correct path relative to actions/find-payment.ts
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';

interface QuickbooksPayment {
	Id: string;
	SyncToken?: string;
	domain?: string;
	MetaData?: {
		CreateTime: string;
		LastUpdatedTime: string;
	};
	TxnDate?: string;
	CurrencyRef?: {
		value: string;
		name?: string;
	};
	CustomerRef: {
		value: string;
		name?: string;
	};
	DepositToAccountRef?: {
		value: string;
		name?: string;
	};
	ProjectRef?: {
		value: string;
		name?: string;
	};
	PaymentMethodRef?: {
		value: string;
		name?: string;
	};
	PaymentRefNum?: string;
	TotalAmt: number;
	UnappliedAmt?: number;
	ProcessPayment?: boolean;
	sparse?: boolean;
	Line?: {
		Amount: number;
		LinkedTxn?: {
			TxnId: string;
			TxnType: string;
		}[];
		LineEx?: any;
	}[];
}

export const findPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'find_payment',
	displayName: 'Find Payment',
	description: 'Finds an existing payment in QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'List all QuickBooks payments belonging to a given customer, identified by the customer Id (not name). Use to retrieve a customer\'s payment history or to check whether they have any payments on record. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		customerId: Property.ShortText({
			displayName: 'Customer ID',
			description: 'The ID of the customer to find payments for.',
			required: true,
		}),
	},
	async run(context) {
		const { customerId } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect.');
		}

		const query = `SELECT * FROM Payment WHERE CustomerRef = '${customerId}'`;

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/payment#query-a-payment
		const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksPayment>>({
			accessToken: context.auth.access_token,
			companyId: companyId as string,
			query,
		});

		if (
			response.QueryResponse?.['Payment'] &&
			response.QueryResponse?.['Payment'].length > 0
		) {
			return {
				found: true,
				result: response.QueryResponse?.['Payment'],
			};
		}

		return {
			found: false,
			result: [],
		};
	},
});
