import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetProfitAndLossDetailReportOutputSchema } from '../../../output-schemas';

export const getProfitAndLossDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_profit_and_loss_detail_report',
	outputSchema: quickbooksSandboxGetProfitAndLossDetailReportOutputSchema,
	displayName: 'Get Profit and Loss Detail Report',
	description: 'Runs the Profit and Loss Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Profit and Loss Detail report: every income and expense transaction behind the Profit and Loss totals, for a date range or named period. Pick Get Profit and Loss Report for totals per account. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		accountingMethod: Property.StaticDropdown({
			displayName: 'Accounting Method',
			description: 'Cash or Accrual. Defaults to the company setting.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Accrual', value: 'Accrual' },
					{ label: 'Cash', value: 'Cash' },
				],
			},
		}),
		account: Property.ShortText({
			displayName: 'Account IDs',
			description: 'Comma-separated account ids to include. Use List Accounts to find them.',
			required: false,
		}),
		accountType: Property.ShortText({
			displayName: 'Account Type',
			description: 'Account type to include, e.g. Bank, AccountsReceivable, OtherCurrentAsset, FixedAsset, AccountsPayable, CreditCard, OtherCurrentLiability, LongTermLiability, Equity, Income, CostOfGoodsSold, Expense, OtherIncome, OtherExpense.',
			required: false,
		}),
		customer: Property.ShortText({
			displayName: 'Customer IDs',
			description: 'Comma-separated customer ids to include. Use List Customers to find them.',
			required: false,
		}),
		vendor: Property.ShortText({
			displayName: 'Vendor IDs',
			description: 'Comma-separated vendor ids to include. Use List Vendors to find them.',
			required: false,
		}),
		employee: Property.ShortText({
			displayName: 'Employee IDs',
			description: 'Comma-separated employee ids to include. Use List Employees to find them.',
			required: false,
		}),
		classIds: Property.ShortText({
			displayName: 'Class IDs',
			description: 'Comma-separated class ids to include. Use List Classes to find them.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department IDs',
			description: 'Comma-separated department (location) ids to include. Use List Departments to find them.',
			required: false,
		}),
		paymentMethod: Property.ShortText({
			displayName: 'Payment Method IDs',
			description: 'Comma-separated payment method ids to include. Use List Payment Methods to find them.',
			required: false,
		}),
		adjustedGainLoss: quickbooksAiProps.flag({
			required: false,
			displayName: 'Include Unrealized Gain and Loss',
			description: 'Include unrealized foreign-exchange gain and loss adjustments. Only matters for multicurrency companies.',
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
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name,memo,split_acc,subt_nat_amount,rbal_nat_amount". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, accountingMethod, account, accountType, customer, vendor, employee, classIds, department, paymentMethod, adjustedGainLoss, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'ProfitAndLossDetail',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				accounting_method: accountingMethod,
				account,
				account_type: accountType,
				customer,
				vendor,
				employee,
				class: classIds,
				department,
				payment_method: paymentMethod,
				adjusted_gain_loss: adjustedGainLoss === undefined ? undefined : adjustedGainLoss === 'true',
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
