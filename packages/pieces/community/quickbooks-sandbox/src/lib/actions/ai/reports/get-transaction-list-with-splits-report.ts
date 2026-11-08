import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetTransactionListWithSplitsReportOutputSchema } from '../../../output-schemas';

export const getTransactionListWithSplitsReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_transaction_list_with_splits_report',
	outputSchema: quickbooksSandboxGetTransactionListWithSplitsReportOutputSchema,
	displayName: 'Get Transaction List with Splits Report',
	description: 'Runs the Transaction List with Splits report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Transaction List with Splits report: every transaction in the period with each of its account lines (splits) shown. Pick Get Transaction List Report for one row per transaction. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		startDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Date',
			description: 'First day of the report, YYYY-MM-DD. Use with End Date, or use Date Macro instead.',
		}),
		endDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Date',
			description: 'Last day of the report, YYYY-MM-DD.',
		}),
		dateMacro: Property.ShortText({
			displayName: 'Date Macro',
			description: 'Named period instead of dates, e.g. "Today", "This Month", "Last Month", "This Fiscal Year-to-date", "Last Fiscal Year".',
			required: false,
		}),
		transactionType: Property.ShortText({
			displayName: 'Transaction Type',
			description: 'Transaction type to include, e.g. Invoice, SalesReceipt, CreditMemo, ReceivePayment, Bill, Check, BillPaymentCheck, Deposit, Transfer, JournalEntry.',
			required: false,
		}),
		docNum: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Only include the transaction with this reference (document) number.',
			required: false,
		}),
		paymentMethod: Property.ShortText({
			displayName: 'Payment Method IDs',
			description: 'Comma-separated payment method ids to include. Use List Payment Methods to find them.',
			required: false,
		}),
		sortBy: Property.ShortText({
			displayName: 'Sort By',
			description: 'Column code to sort the rows by, e.g. "tx_date".',
			required: false,
		}),
		sortOrder: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'Ascending or descending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Ascending', value: 'ascend' },
					{ label: 'Descending', value: 'descend' },
				],
			},
		}),
		columns: Property.ShortText({
			displayName: 'Columns',
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name,memo,account_name,subt_nat_amount". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, transactionType, docNum, paymentMethod, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'TransactionListWithSplits',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				transaction_type: transactionType,
				docnum: docNum,
				payment_method: paymentMethod,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
