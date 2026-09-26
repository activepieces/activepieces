import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listCampaignsOutputSchema } from '../output-schemas';

export const listCampaignsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_campaigns',
	classification: 'SEARCH',
	displayName: 'List Campaigns',
	description: 'List campaigns, optionally filtered by status and type.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List MailerLite campaigns with their IDs, status and stats. MailerLite returns only ready (scheduled) campaigns unless status is set, so set status to draft or sent to see those. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: listCampaignsOutputSchema,
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return campaigns with this status. MailerLite defaults to ready.',
			required: false,
			options: {
				options: [
					{ label: 'Draft', value: 'draft' },
					{ label: 'Ready', value: 'ready' },
					{ label: 'Sent', value: 'sent' },
				],
			},
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Only return campaigns of this type.',
			required: false,
			options: {
				options: [
					{ label: 'Regular', value: 'regular' },
					{ label: 'A/B split', value: 'ab' },
					{ label: 'Resend', value: 'resend' },
					{ label: 'RSS', value: 'rss' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 25).',
			required: false,
			defaultValue: 25,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/campaigns',
			queryParams: {
				'filter[status]': context.propsValue.status,
				'filter[type]': context.propsValue.type,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 25, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
