import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { subscriberActivityOutputSchema } from '../output-schemas';

export const getSubscriberActivityAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_subscriber_activity',
	classification: 'SEARCH',
	displayName: 'Get Subscriber Activity',
	description: 'List the activity log of a subscriber.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the activity log of a MailerLite subscriber (campaign sends, opens, clicks, bounces, unsubscribes and more), given the subscriber ID from find_subscriber. Optionally filter by one log type. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: subscriberActivityOutputSchema,
	props: {
		subscriber_id: Property.ShortText({
			displayName: 'Subscriber ID',
			description: 'The subscriber ID, from find_subscriber or list_subscribers.',
			required: true,
		}),
		log_name: Property.StaticDropdown({
			displayName: 'Activity Type',
			description: 'Only return this type of activity.',
			required: false,
			options: {
				options: [
					{ label: 'Campaign send', value: 'campaign_send' },
					{ label: 'Automation email sent', value: 'automation_email_sent' },
					{ label: 'Email open', value: 'email_open' },
					{ label: 'Link click', value: 'link_click' },
					{ label: 'Email bounce', value: 'email_bounce' },
					{ label: 'Spam complaint', value: 'spam_complaint' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Email forward', value: 'email_forward' },
					{ label: 'Marketing preferences change', value: 'marketing_preferences_change' },
					{ label: 'Preference center', value: 'preference_center' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 100).',
			required: false,
			defaultValue: 100,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/subscribers/${id}/activity-log`,
			resource: `subscriber ${id}`,
			queryParams: {
				'filter[log_name]': context.propsValue.log_name,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 100, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
