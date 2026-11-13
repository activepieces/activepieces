import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTermOutputSchema } from '../../../output-schemas';

export const createTermAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_term',
	outputSchema: quickbooksSandboxCreateTermOutputSchema,
	displayName: 'Create Term',
	description: 'Creates a payment term such as Net 30.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a payment term, referenced by SalesTermRef on invoices and bills. Set either Due Days (a standard term, e.g. Net 30) or Day of Month Due (a date-driven term), not both. Not idempotent: each call creates a new term, and a duplicate name is rejected.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Term name, unique among terms, e.g. "Net 45".',
			required: true,
		}),
		dueDays: Property.Number({
			displayName: 'Due Days',
			description: 'Standard term: payment is due this many days after the transaction date.',
			required: false,
		}),
		discountDays: Property.Number({
			displayName: 'Discount Days',
			description: 'Standard term: the early-payment discount applies when paid within this many days.',
			required: false,
		}),
		dayOfMonthDue: Property.Number({
			displayName: 'Day of Month Due',
			description: 'Date-driven term: payment is due on this day of the month (1-31).',
			required: false,
		}),
		dueNextMonthDays: Property.Number({
			displayName: 'Due Next Month Days',
			description: 'Date-driven term: a transaction dated within this many days of the due date is due the following month.',
			required: false,
		}),
		discountDayOfMonth: Property.Number({
			displayName: 'Discount Day of Month',
			description: 'Date-driven term: the early-payment discount applies when paid by this day of the month.',
			required: false,
		}),
		discountPercent: Property.Number({
			displayName: 'Discount Percent',
			description: 'Early-payment discount, as a percentage, e.g. 2 for 2%.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, dueDays, discountDays, dayOfMonthDue, dueNextMonthDays, discountDayOfMonth, discountPercent, additionalFields } =
			context.propsValue;
		if (!isNil(dueDays) && !isNil(dayOfMonthDue)) {
			throw new Error('Set either Due Days or Day of Month Due, not both.');
		}
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Term',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						DueDays: dueDays,
						DiscountDays: discountDays,
						DayOfMonthDue: dayOfMonthDue,
						DueNextMonthDays: dueNextMonthDays,
						DiscountDayOfMonth: discountDayOfMonth,
						DiscountPercent: discountPercent,
					},
				}),
			},
		});
	},
});

function isNil(value: number | null | undefined): boolean {
	return value === undefined || value === null;
}
