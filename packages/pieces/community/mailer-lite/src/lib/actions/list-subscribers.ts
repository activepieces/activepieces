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
			description: 'Maximum number of subscribers to return (default 25)',
			required: false,
			defaultValue: 25,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const { status, limit } = context.propsValue;
		const isKnownStatus =
			status === 'active' ||
			status === 'unsubscribed' ||
			status === 'unconfirmed' ||
			status === 'bounced' ||
			status === 'junk';
		const response = await client.subscribers.get(
			isKnownStatus
				? { limit: limit ?? 25, filter: { status } }
				: { limit: limit ?? 25 },
		);
		return response.data;
	},
});
