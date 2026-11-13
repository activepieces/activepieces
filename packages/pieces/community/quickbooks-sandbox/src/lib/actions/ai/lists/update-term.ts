import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTermOutputSchema } from '../../../output-schemas';

export const updateTermAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_term',
	outputSchema: quickbooksSandboxCreateTermOutputSchema,
	displayName: 'Update Term',
	description: 'Changes fields of an existing payment term.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one payment term: it reads the current term and sends it back with your changes, so unset fields keep their values. Terms cannot be deleted; set Active to No to deactivate one. Get the id from List Terms.',
		idempotent: true,
	},
	props: {
		termId: quickbooksAiProps.id({
			required: true,
			displayName: 'Term ID',
			description: 'QuickBooks term id. Use List Terms to find it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New term name.', required: false }),
		dueDays: Property.Number({ displayName: 'Due Days', description: 'Standard term: new days until due.', required: false }),
		discountDays: Property.Number({
			displayName: 'Discount Days',
			description: 'Standard term: new early-payment discount window, in days.',
			required: false,
		}),
		dayOfMonthDue: Property.Number({
			displayName: 'Day of Month Due',
			description: 'Date-driven term: new day of the month payment is due (1-31).',
			required: false,
		}),
		dueNextMonthDays: Property.Number({
			displayName: 'Due Next Month Days',
			description: 'Date-driven term: new cutoff, in days before the due date, after which a transaction is due next month.',
			required: false,
		}),
		discountDayOfMonth: Property.Number({
			displayName: 'Discount Day of Month',
			description: 'Date-driven term: new day of the month by which the discount applies.',
			required: false,
		}),
		discountPercent: Property.Number({
			displayName: 'Discount Percent',
			description: 'New early-payment discount, as a percentage.',
			required: false,
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the term (the way to remove it); Yes reactivates it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			termId,
			name,
			dueDays,
			discountDays,
			dayOfMonthDue,
			dueNextMonthDays,
			discountDayOfMonth,
			discountPercent,
			active,
			additionalFields,
		} = context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
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
						Active: active ? active === 'true' : undefined,
					},
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Term', id: termId, fields });
	},
});
