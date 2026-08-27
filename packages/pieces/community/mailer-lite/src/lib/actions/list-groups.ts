import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { listGroupsOutputSchema } from '../output-schemas';

export const listGroupsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_groups',
	classification: 'READ',
	displayName: 'List Groups',
	description: 'List all groups in the account.',
	audience: 'both',
	aiMetadata: {
		description:
			'List all MailerLite groups with their subscriber counts and engagement stats. Use this to discover which groups exist before assigning a subscriber, or to report on list sizes. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: listGroupsOutputSchema,
	props: {},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.get({ limit: 100, sort: 'name' });
		return response.data;
	},
});
