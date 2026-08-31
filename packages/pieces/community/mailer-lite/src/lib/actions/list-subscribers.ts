import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { listSubscribersOutputSchema } from '../output-schemas';

export const listSubscribersAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_subscribers',
	classification: 'READ',
	displayName: 'List Subscribers',
	description: 'List subscribers, optionally filtered by status.',
	audience: 'both',
	aiMetadata: {
		description:
			'List MailerLite subscribers, optionally filtered by status (active, unsubscribed, unconfirmed, bounced, junk). Use this to enumerate contacts for reporting or bulk processing. Returns a page of subscriber records with cursor pagination. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: listSubscribersOutputSchema,
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return subscribers with this status',
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
			description: 'Subscribers to return (1-1000, default 25).',
			required: false,
			defaultValue: 25,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const { status, limit } = context.propsValue;
		const resolvedLimit = Math.trunc(Number(limit ?? 25));
		if (!Number.isFinite(resolvedLimit) || resolvedLimit < 1 || resolvedLimit > 1000) {
			throw new Error('Limit must be between 1 and 1000.');
		}
		const isKnownStatus =
			status === 'active' ||
			status === 'unsubscribed' ||
			status === 'unconfirmed' ||
			status === 'bounced' ||
			status === 'junk';
		const response = await client.subscribers.get(
			isKnownStatus
				? { limit: resolvedLimit, filter: { status } }
				: { limit: resolvedLimit },
		);
		return response.data;
	},
});
