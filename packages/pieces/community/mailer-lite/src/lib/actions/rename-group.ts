import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { groupOutputSchema } from '../output-schemas';

export const renameGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'rename_group',
	classification: 'WRITE',
	displayName: 'Rename Group',
	description: 'Rename a subscriber group.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Rename a MailerLite group by ID. Only the name changes; members are untouched. Get the ID from list_groups or find_groups_by_name. Idempotent: the same name twice leaves the same state.',
		idempotent: true,
	},
	outputSchema: groupOutputSchema,
	props: {
		group_id: Property.ShortText({
			displayName: 'Group ID',
			description: 'The group ID, from list_groups or find_groups_by_name.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new group name (max 255 characters).',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.group_id, label: 'Group ID' });
		const name = context.propsValue.name.trim();
		if (!name) {
			throw new Error('Name is required.');
		}
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/groups/${id}`,
			resource: `group ${id}`,
			body: { name },
		});
		return mailerLiteApi.unwrapData(body);
	},
});
