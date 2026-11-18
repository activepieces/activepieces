import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function id<R extends boolean>({ required, displayName = 'ID', description }: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function where<R extends boolean>({
	required,
	displayName = 'Where',
	description = 'Optional QuickBooks query filter, without the WHERE keyword, e.g. "TxnDate >= \'2025-01-01\' AND Balance > \'0\'". Strings and dates go in single quotes. Supports =, <, >, <=, >=, IN and LIKE (with %), joined by AND only.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function orderBy<R extends boolean>({
	required,
	displayName = 'Order By',
	description = 'Optional sort, without the ORDERBY keyword, e.g. "MetaData.LastUpdatedTime DESC".',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of records to return (1-1000). Defaults to 100.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function startPosition<R extends boolean>({
	required,
	displayName = 'Start Position',
	description = '1-based position of the first record to return, for paging. Use the previous response\'s nextStartPosition. Defaults to 1.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function lines<R extends boolean>({
	required,
	displayName = 'Lines',
	description,
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function additionalFields<R extends boolean>({
	required,
	displayName = 'Additional Fields',
	description = 'Optional JSON object with any other fields of the QuickBooks object, in QuickBooks\' own field names, e.g. {"ClassRef": {"value": "5"}, "SalesTermRef": {"value": "3"}}. The dedicated inputs override the same fields here.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function date<R extends boolean>({ required, displayName = 'Date', description }: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function flag<R extends boolean>({ required, displayName = 'Enabled', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 'true' },
				{ label: 'No', value: 'false' },
			],
		},
	});
}

function sendTo<R extends boolean>({
	required,
	displayName = 'Send To',
	description = 'Email address to send to. Leave empty to use the email address already on the transaction.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function accountType<R extends boolean>({ required, displayName = 'Account Type', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: ACCOUNT_TYPES.map((type) => ({ label: type, value: type })),
		},
	});
}

function budgetType<R extends boolean>({ required, displayName = 'Budget Type', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Profit and loss', value: 'ProfitAndLoss' },
				{ label: 'Balance sheet', value: 'BalanceSheet' },
			],
		},
	});
}

function budgetEntryType<R extends boolean>({ required, displayName = 'Entry Period', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Monthly', value: 'Monthly' },
				{ label: 'Quarterly', value: 'Quarterly' },
				{ label: 'Annually', value: 'Annually' },
			],
		},
	});
}

function paymentMethodType<R extends boolean>({ required, displayName = 'Type', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Credit card', value: 'CREDIT_CARD' },
				{ label: 'Not a credit card', value: 'NON_CREDIT_CARD' },
			],
		},
	});
}

function recurringTransactionType<R extends boolean>({ required, displayName = 'Transaction Type', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: RECURRING_TRANSACTION_TYPES.map((type) => ({ label: type, value: type })),
		},
	});
}

export const quickbooksAiProps = {
	id,
	where,
	orderBy,
	limit,
	startPosition,
	lines,
	additionalFields,
	date,
	flag,
	sendTo,
	accountType,
	budgetType,
	budgetEntryType,
	paymentMethodType,
	recurringTransactionType,
};

const ACCOUNT_TYPES = [
	'Bank',
	'Accounts Receivable',
	'Other Current Asset',
	'Fixed Asset',
	'Other Asset',
	'Accounts Payable',
	'Credit Card',
	'Other Current Liability',
	'Long Term Liability',
	'Equity',
	'Income',
	'Other Income',
	'Cost of Goods Sold',
	'Expense',
	'Other Expense',
];

const RECURRING_TRANSACTION_TYPES = [
	'Bill',
	'CreditMemo',
	'Deposit',
	'Estimate',
	'Invoice',
	'JournalEntry',
	'Purchase',
	'PurchaseOrder',
	'RefundReceipt',
	'SalesReceipt',
	'Transfer',
	'VendorCredit',
];
