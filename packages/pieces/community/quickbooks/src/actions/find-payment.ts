import { Property, createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../index'; // Correct path relative to actions/find-payment.ts
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';

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

		const apiUrl = quickbooksCommon.getApiUrl(companyId);
		const query = `SELECT * FROM Payment WHERE CustomerRef = '${customerId}'`;

		const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksPayment>>({
			method: HttpMethod.GET,
			url: `${apiUrl}/query?query=${encodeURIComponent(query)}&minorversion=70`,
			headers: {
				Authorization: `Bearer ${context.auth.access_token}`,
				Accept: 'application/json',
			},
		});

		if (
			response.body.QueryResponse?.['Payment'] &&
			response.body.QueryResponse?.['Payment'].length > 0
		) {
			return {
				found: true,
				result: response.body.QueryResponse?.['Payment'],
			};
		}

		return {
			found: false,
			result: [],
		};
	},
});
