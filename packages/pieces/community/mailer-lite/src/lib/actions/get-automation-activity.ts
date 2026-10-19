import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { automationActivityOutputSchema } from '../output-schemas';

export const getAutomationActivityAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_automation_activity',
	classification: 'SEARCH',
	displayName: 'Get Automation Activity',
	description: 'List subscriber activity in an automation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the subscribers who went through a MailerLite automation, given the automation ID from list_automations. status is required: completed, active, canceled or failed. Date filters use YYYY-MM-DD: date_from/date_to apply to finished runs, scheduled_from/scheduled_to to active runs. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: automationActivityOutputSchema,
	props: {
		automation_id: Property.ShortText({
			displayName: 'Automation ID',
			description: 'The automation ID, from list_automations.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Which activity to return.',
			required: true,
			options: {
				options: [
					{ label: 'Completed', value: 'completed' },
					{ label: 'Active', value: 'active' },
					{ label: 'Canceled', value: 'canceled' },
					{ label: 'Failed', value: 'failed' },
				],
			},
		}),
		date_from: Property.ShortText({
			displayName: 'Date From',
			description: 'Finished on or after this date (YYYY-MM-DD).',
			required: false,
		}),
		date_to: Property.ShortText({
			displayName: 'Date To',
			description: 'Finished on or before this date (YYYY-MM-DD).',
			required: false,
		}),
		scheduled_from: Property.ShortText({
			displayName: 'Scheduled From',
			description: 'Active runs scheduled on or after this date (YYYY-MM-DD).',
			required: false,
		}),
		scheduled_to: Property.ShortText({
			displayName: 'Scheduled To',
			description: 'Active runs scheduled on or before this date (YYYY-MM-DD).',
			required: false,
		}),
		search: Property.ShortText({
			displayName: 'Subscriber Email',
			description: 'Only return activity for subscribers whose email matches this text.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 10).',
			required: false,
			defaultValue: 10,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.automation_id, label: 'Automation ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/automations/${id}/activity`,
			resource: `automation ${id}`,
			queryParams: {
				'filter[status]': context.propsValue.status,
				'filter[date_from]': context.propsValue.date_from,
				'filter[date_to]': context.propsValue.date_to,
				'filter[scheduled_from]': context.propsValue.scheduled_from,
				'filter[scheduled_to]': context.propsValue.scheduled_to,
				'filter[search]': context.propsValue.search,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 10, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
