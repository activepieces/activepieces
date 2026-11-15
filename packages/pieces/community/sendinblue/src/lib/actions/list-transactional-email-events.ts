import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listTransactionalEmailEventsActionOutputSchema } from '../output-schemas';

export const listTransactionalEmailEvents = createAction({
	auth: sendinblueAuth,
	name: 'list_transactional_email_events',
	outputSchema: listTransactionalEmailEventsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Transactional Email Events',
	description: 'List transactional email events (delivered, opened, clicked, bounced, etc) from Brevo.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists historical transactional email events (delivery, open, click, bounce, spam and similar), optionally filtered by recipient, event type, tags, message id or template. Use this to pull events already recorded by Brevo on demand instead of waiting for the email_delivered/email_opened/email_clicked/email_bounced webhook triggers, for example to audit a specific send or backfill data from before a webhook was configured. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		days: Property.Number({
			displayName: 'Days',
			description:
				'Number of past days to include, 1-90. Cannot be combined with Start Date/End Date. Brevo defaults to 30 days if none of days, start date or end date are given.',
			required: false,
		}),
		start_date: Property.ShortText({
			displayName: 'Start Date',
			description:
				"Start of the date range, format 'YYYY-MM-DD'. Must be given together with End Date, and cannot be combined with Days. The range is capped at 90 days.",
			required: false,
		}),
		end_date: Property.ShortText({
			displayName: 'End Date',
			description:
				"End of the date range, format 'YYYY-MM-DD'. Must be given together with Start Date, and cannot be combined with Days. The range is capped at 90 days.",
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Filter events down to a single recipient email address.',
			required: false,
		}),
		event: Property.StaticDropdown({
			displayName: 'Event',
			description: 'Filter down to a single event type.',
			required: false,
			options: {
				options: [
					{ label: 'Bounces', value: 'bounces' },
					{ label: 'Hard Bounces', value: 'hardBounces' },
					{ label: 'Soft Bounces', value: 'softBounces' },
					{ label: 'Delivered', value: 'delivered' },
					{ label: 'Spam', value: 'spam' },
					{ label: 'Requests', value: 'requests' },
					{ label: 'Opened', value: 'opened' },
					{ label: 'Clicks', value: 'clicks' },
					{ label: 'Invalid', value: 'invalid' },
					{ label: 'Deferred', value: 'deferred' },
					{ label: 'Blocked', value: 'blocked' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Error', value: 'error' },
					{ label: 'Loaded By Proxy', value: 'loadedByProxy' },
				],
			},
		}),
		tags: Property.ShortText({
			displayName: 'Tags',
			description: 'Comma-separated tags to filter events by.',
			required: false,
		}),
		message_id: Property.ShortText({
			displayName: 'Message ID',
			description: 'Filter events down to a single message id.',
			required: false,
		}),
		template_id: Property.Number({
			displayName: 'Template ID',
			description: 'Filter events down to emails sent from this template id.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of events to return per page. Defaults to 50, maximum 5000.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Index of the first event to return. Defaults to 0.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order for the results, based on the event date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const {
			days,
			start_date,
			end_date,
			email,
			event,
			tags,
			message_id,
			template_id,
			limit,
			offset,
			sort,
		} = context.propsValue;

		if (!isNil(days) && (!isNil(start_date) || !isNil(end_date))) {
			throw new Error(
				'Provide either days, or start_date and end_date together, not both',
			);
		}

		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/smtp/statistics/events',
			query: {
				limit,
				offset,
				startDate: start_date,
				endDate: end_date,
				days,
				email,
				event,
				tags,
				messageId: message_id,
				templateId: template_id,
				sort,
			},
		});

		return response;
	},
});
