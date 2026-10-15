import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listSegmentSubscribersOutputSchema } from '../output-schemas';

export const listSegmentSubscribersAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_segment_subscribers',
	classification: 'SEARCH',
	displayName: 'List Segment Subscribers',
	description: 'List the subscribers that match a segment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the subscribers that match a MailerLite segment, given the segment ID from list_segments. By default MailerLite returns active subscribers only; set status to list unsubscribed, unconfirmed, bounced or junk ones instead. Cursor-paginated: pass meta.next_cursor back as cursor to get the next page. Read-only.',
		idempotent: true,
	},
	outputSchema: listSegmentSubscribersOutputSchema,
	props: {
		segment_id: Property.ShortText({
			displayName: 'Segment ID',
			description: 'The segment ID, from list_segments.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return subscribers with this status. MailerLite defaults to active.',
			required: false,
			options: {
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Unconfirmed', value: 'unconfirmed' },
					{ label: 'Bounced', value: 'bounced' },
					{ label: 'Junk', value: 'junk' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-1000, default 50).',
			required: false,
			defaultValue: 50,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'The meta.next_cursor value from the previous page. Leave empty for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.segment_id, label: 'Segment ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/segments/${id}/subscribers`,
			resource: `segment ${id}`,
			queryParams: {
				'filter[status]': context.propsValue.status,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 50, max: 1000 }),
				cursor: context.propsValue.cursor,
			},
		});
		return body;
	},
});
