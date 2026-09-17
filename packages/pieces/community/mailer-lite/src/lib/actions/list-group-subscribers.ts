import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteCommon } from '../common';
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
			'List the subscribers that belong to a specific MailerLite group, given the group ID. Use this to enumerate the members of a segment before messaging or reporting on them. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: listGroupSubscribersOutputSchema,
	props: {
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Subscribers to return (1-1000, default 25).',
			required: false,
			defaultValue: 25,
		}),
	},
	async run(context) {
		const resolvedLimit = Math.trunc(Number(context.propsValue.limit ?? 25));
		if (!Number.isFinite(resolvedLimit) || resolvedLimit < 1 || resolvedLimit > 1000) {
			throw new Error('Limit must be between 1 and 1000.');
		}
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.getSubscribers(context.propsValue.subscriberGroupId!, {
			limit: resolvedLimit,
			page: 1,
		});
		return response.data;
	},
});
