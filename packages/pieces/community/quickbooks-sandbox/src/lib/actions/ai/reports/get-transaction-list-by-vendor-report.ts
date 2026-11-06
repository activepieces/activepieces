import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetTransactionListByCustomerReportOutputSchema } from '../../../output-schemas';

export const getTransactionListByVendorReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_transaction_list_by_vendor_report',
	outputSchema: quickbooksSandboxGetTransactionListByCustomerReportOutputSchema,
	displayName: 'Get Transaction List by Vendor Report',
	description: 'Runs the Transaction List by Vendor report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Transaction List by Vendor report: every transaction in the period, grouped under each vendor. Pick Get Transaction List Report for one flat list. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		vendor: Property.ShortText({
			displayName: 'Vendor IDs',
			description: 'Comma-separated vendor ids to include. Use List Vendors to find them.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department IDs',
			description: 'Comma-separated department (location) ids to include. Use List Departments to find them.',
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
		term: Property.ShortText({
			displayName: 'Term IDs',
			description: 'Comma-separated payment term ids to include. Use List Terms to find them.',
			required: false,
		}),
		apPaid: Property.StaticDropdown({
			displayName: 'Bill Status',
			description: 'Include all, paid or unpaid bills.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'All' },
					{ label: 'Paid', value: 'Paid' },
					{ label: 'Unpaid', value: 'Unpaid' },
				],
			},
		}),
		cleared: Property.StaticDropdown({
			displayName: 'Cleared Status',
			description: 'Only include transactions with this bank clearing status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Cleared', value: 'Cleared' },
					{ label: 'Uncleared', value: 'Uncleared' },
					{ label: 'Reconciled', value: 'Reconciled' },
					{ label: 'Deposited', value: 'Deposited' },
				],
			},
		}),
		startDueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Due Date',
			description: 'Only include transactions due on or after this date, YYYY-MM-DD.',
		}),
		endDueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Due Date',
			description: 'Only include transactions due on or before this date, YYYY-MM-DD.',
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
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name,memo,account_name,other_account,subt_nat_amount". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, vendor, department, transactionType, docNum, paymentMethod, term, apPaid, cleared, startDueDate, endDueDate, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'TransactionListByVendor',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				vendor,
				department,
				transaction_type: transactionType,
				docnum: docNum,
				payment_method: paymentMethod,
				term,
				appaid: apPaid,
				cleared,
				start_duedate: startDueDate,
				end_duedate: endDueDate,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
