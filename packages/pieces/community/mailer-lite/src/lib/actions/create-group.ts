import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { createGroupOutputSchema } from '../output-schemas';

export const createGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'create_group',
	classification: 'WRITE',
	displayName: 'Create Group',
	description: 'Create a new group.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a new MailerLite group by name. Use this when a flow needs a segment that does not exist yet, before assigning subscribers to it. Not idempotent: calling twice with the same name creates two groups, since MailerLite does not enforce unique group names.',
		idempotent: false,
	},
	outputSchema: createGroupOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Group Name',
			required: true,
		}),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.create({ name: context.propsValue.name });
		return response.data;
	},
});
