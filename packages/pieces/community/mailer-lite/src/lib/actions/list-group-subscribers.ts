import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteCommon } from '../common';
import { mailerLiteApi } from '../common/client';
import { listGroupSubscribersOutputSchema } from '../output-schemas';

export const listGroupSubscribersAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_group_subscribers',
	classification: 'READ',
	displayName: 'List Group Subscribers',
	description: 'List the subscribers belonging to a group.',
	audience: 'both',
	aiMetadata: {
		description:
			'List the subscribers that belong to a specific MailerLite group, given the group ID. By default MailerLite returns active subscribers only; set status to list unsubscribed, unconfirmed, bounced or junk members instead. Cursor-paginated: pass meta.next_cursor back as cursor to get the next page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: listGroupSubscribersOutputSchema,
	propertyGroups: [
		{
			key: 'subscribers',
			display: 'section',
			label: 'Subscribers to List',
			icon: 'users',
			props: ['subscriberGroupId', 'status'],
		},
		{
			key: 'paging',
			display: 'section',
			label: 'Paging',
			icon: 'sliders',
			props: ['limit', 'cursor'],
		},
	],
	props: {
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return subscribers with this status. Empty: active only.',
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
			description: 'How many subscribers to return per page, up to 1000.',
			required: false,
			defaultValue: 25,
			width: 'half',
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'meta.next_cursor from the previous run. Empty: first page.',
			required: false,
			width: 'half',
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.subscriberGroupId, label: 'Group' });
		return mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/groups/${id}/subscribers`,
			resource: `group ${id}`,
			queryParams: {
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 25, max: 1000 }),
				cursor: context.propsValue.cursor,
				'filter[status]': context.propsValue.status,
			},
		});
	},
});
