import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdatePurchaseOutputSchema } from '../../../output-schemas';

export const updatePurchaseAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_purchase',
	outputSchema: quickbooksSandboxUpdatePurchaseOutputSchema,
	displayName: 'Update Purchase',
	description: 'Changes fields of an existing purchase.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one purchase (expense, check or credit card charge) as a sparse update; the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Purchase) with your changes. Get the id from List Purchases.',
		idempotent: true,
	},
	props: {
		purchaseId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase ID',
			description: 'QuickBooks purchase id. Use List Purchases to find it.',
		}),
		paymentType: Property.StaticDropdown({
			displayName: 'Payment Type',
			description: 'New payment type. Cash and Check need a bank account, CreditCard a credit card account.',
			required: false,
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
			required: false,
			displayName: 'Payment Account ID',
			description: 'New bank or credit card account id. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks line format, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 45.5, "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "13"}}}].',
		}),
		payeeId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payee ID',
			description: 'New payee id; set Payee Type with it. Use List Vendors, List Customers or List Employees to find it.',
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
			description: 'New date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'Reference Number', description: 'New reference number.', required: false }),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'New payment method id. Use List Payment Methods to find it.',
		}),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			purchaseId,
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
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Purchase',
			id: purchaseId,
			requiredFields: ['PaymentType', 'AccountRef'],
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
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
