import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreatePurchaseOutputSchema } from '../../../output-schemas';

export const createPurchaseAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_purchase',
	outputSchema: quickbooksSandboxCreatePurchaseOutputSchema,
	displayName: 'Create Purchase',
	description: 'Records an expense, check or credit card charge.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records money already spent (a cash expense, a check or a credit card charge) from a bank or credit card account; for an amount owed to pay later use Create Bill. Account ids come from List Accounts, payee ids from List Vendors, List Customers or List Employees. Not idempotent: each call records a new purchase.',
		idempotent: false,
	},
	props: {
		paymentType: Property.StaticDropdown({
			displayName: 'Payment Type',
			description: 'How it was paid. Cash and Check need a bank account, CreditCard a credit card account.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Cash', value: 'Cash' },
					{ label: 'Check', value: 'Check' },
					{ label: 'Credit Card', value: 'CreditCard' },
				],
			},
		}),
		accountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment Account ID',
			description: 'Bank or credit card account the money came from. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 45.5, "Description": "Team lunch", "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "13"}}}]. For items use "ItemBasedExpenseLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 45.5}.',
		}),
		payeeId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payee ID',
			description: 'Id of who was paid; set Payee Type with it. Use List Vendors, List Customers or List Employees to find it.',
		}),
		payeeType: Property.StaticDropdown({
			displayName: 'Payee Type',
			description: 'Kind of payee that Payee ID refers to.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Vendor', value: 'Vendor' },
					{ label: 'Customer', value: 'Customer' },
					{ label: 'Employee', value: 'Employee' },
				],
			},
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the purchase, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Check number or other reference.',
			required: false,
		}),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'Payment method id. Use List Payment Methods to find it.',
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal memo.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			paymentType,
			accountId,
			lines,
			payeeId,
			payeeType,
			txnDate,
			docNumber,
			paymentMethodId,
			privateNote,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Purchase',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						PaymentType: paymentType,
						AccountRef: quickbooksUtils.ref({ value: accountId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						EntityRef: payeeRef({ payeeId, payeeType }),
						TxnDate: txnDate,
						DocNumber: docNumber,
						PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});

function payeeRef({
	payeeId,
	payeeType,
}: {
	payeeId: string | undefined;
	payeeType: string | undefined;
}): { value: string; type: string } | undefined {
	const hasId = payeeId !== undefined && payeeId !== '';
	const hasType = payeeType !== undefined && payeeType !== '';
	if (hasId !== hasType) {
		throw new Error('Set Payee ID and Payee Type together.');
	}
	return payeeId && payeeType ? { value: payeeId, type: payeeType } : undefined;
}
