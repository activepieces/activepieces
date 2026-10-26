import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSenderOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListSendersAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_senders',
	outputSchema: mailjetSenderOutputSchema,
	displayName: 'List Senders',
	description: 'Lists sender addresses and domains.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists senders (addresses or *@domain) with their IDs and status; only Active senders can send. Filter by email, domain or status. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Only this sender address.',
			required: false,
		}),
		domain: Property.ShortText({
			displayName: 'Domain',
			description: 'Only senders on this domain.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only senders with this status.',
			required: false,
			options: {
				options: [
					{ label: 'Inactive', value: 'Inactive' },
					{ label: 'Active', value: 'Active' },
					{ label: 'Deleted', value: 'Deleted' },
				],
			},
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/sender',
			query: { Email: p.email, Domain: p.domain, Status: p.status, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
