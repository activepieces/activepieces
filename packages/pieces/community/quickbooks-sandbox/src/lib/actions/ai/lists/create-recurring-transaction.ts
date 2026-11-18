import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateRecurringTransactionOutputSchema } from '../../../output-schemas';

export const createRecurringTransactionAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_recurring_transaction',
	outputSchema: quickbooksSandboxCreateRecurringTransactionOutputSchema,
	displayName: 'Create Recurring Transaction',
	description: 'Creates a recurring transaction template on a schedule.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a recurring template for one transaction type (e.g. a monthly Bill or Invoice): the transaction body is what each occurrence copies, and the schedule inputs fill its RecurringInfo. Automated templates post on schedule, Reminded ones remind you, UnScheduled ones need no schedule. Needs QuickBooks Online Essentials or higher; refs in the body come from the matching List actions (e.g. List Customers, List Accounts). Not idempotent: each call creates a new template.',
		idempotent: false,
	},
	props: {
		transactionType: quickbooksAiProps.recurringTransactionType({
			required: true,
			displayName: 'Transaction Type',
			description: 'QuickBooks transaction type the template creates.',
		}),
		transaction: Property.Json({
			displayName: 'Transaction',
			description:
				'JSON body of the template transaction, in QuickBooks\' own field names for that type, e.g. for a Bill {"VendorRef": {"value": "56"}, "Line": [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 200, "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}}]}. Omit TxnDate. RecurringInfo is built from the schedule inputs.',
			required: true,
		}),
		recurringName: Property.ShortText({
			displayName: 'Template Name',
			description: 'Name of the recurring template, unique among templates.',
			required: true,
		}),
		recurType: Property.StaticDropdown({
			displayName: 'Recurrence Type',
			description: 'Automated creates each transaction on schedule; Reminded reminds you to create it; UnScheduled is a saved template with no schedule.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Automated', value: 'Automated' },
					{ label: 'Reminded', value: 'Reminded' },
					{ label: 'Unscheduled', value: 'UnScheduled' },
				],
			},
		}),
		intervalType: Property.StaticDropdown({
			displayName: 'Interval',
			description: 'How often the transaction repeats. Required unless the recurrence type is Unscheduled.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Daily', value: 'Daily' },
					{ label: 'Weekly', value: 'Weekly' },
					{ label: 'Monthly', value: 'Monthly' },
					{ label: 'Yearly', value: 'Yearly' },
				],
			},
		}),
		numInterval: Property.Number({
			displayName: 'Every',
			description: 'Repeat every this many intervals, e.g. 2 with Monthly is every other month. Defaults to 1.',
			required: false,
		}),
		dayOfMonth: Property.Number({
			displayName: 'Day of Month',
			description: 'Monthly: the day of the month (1-31) each transaction is dated.',
			required: false,
		}),
		dayOfWeek: Property.StaticDropdown({
			displayName: 'Day of Week',
			description: 'Weekly: the weekday each transaction is dated.',
			required: false,
			options: {
				disabled: false,
				options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => ({
					label: day,
					value: day,
				})),
			},
		}),
		startDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Date',
			description: 'Date of the first occurrence, YYYY-MM-DD.',
		}),
		endDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Date',
			description: 'Date after which no more occurrences are created, YYYY-MM-DD. Leave empty to repeat with no end.',
		}),
		maxOccurrences: Property.Number({
			displayName: 'Max Occurrences',
			description: 'Stop after this many occurrences, instead of an end date.',
			required: false,
		}),
	},
	async run(context) {
		const {
			transactionType,
			transaction,
			recurringName,
			recurType,
			intervalType,
			numInterval,
			dayOfMonth,
			dayOfWeek,
			startDate,
			endDate,
			maxOccurrences,
		} = context.propsValue;
		const scheduleInfo = quickbooksUtils.compact({
			fields: {
				IntervalType: intervalType,
				NumInterval: numInterval,
				DayOfMonth: dayOfMonth,
				DayOfWeek: dayOfWeek,
				StartDate: startDate,
				EndDate: endDate,
				MaxOccurrences: maxOccurrences,
			},
		});
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'RecurringTransaction',
			body: {
				[transactionType]: {
					...transaction,
					RecurringInfo: quickbooksUtils.compact({
						fields: {
							Active: true,
							Name: recurringName,
							RecurType: recurType,
							ScheduleInfo: scheduleInfo,
						},
					}),
				},
			},
		});
	},
});

