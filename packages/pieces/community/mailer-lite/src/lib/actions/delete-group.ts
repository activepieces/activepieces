import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteGroupOutputSchema } from '../output-schemas';

export const deleteGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_group',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Group',
	description: 'Delete a subscriber group.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite group by ID. The group membership is removed but the subscribers themselves are kept. Cannot be undone. Get the ID from list_groups or find_groups_by_name. Not idempotent: deleting an already-deleted group returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteGroupOutputSchema,
	props: {
		group_id: Property.ShortText({
			displayName: 'Group ID',
			description: 'The group ID, from list_groups or find_groups_by_name.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.group_id, label: 'Group ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/groups/${id}`,
			resource: `group ${id}`,
		});
		return { deleted: true, group_id: context.propsValue.group_id.trim() };
	},
});
