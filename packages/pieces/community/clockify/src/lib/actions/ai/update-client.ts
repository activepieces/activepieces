import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { changedClientOutputSchema } from '../../output-schemas';

export const updateClientAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_client',
	outputSchema: changedClientOutputSchema,
	displayName: 'Update Client',
	description: 'Updates or archives a client.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a client name, email, address or note, or archives / unarchives it. Only the fields you set change: the action reads the client and sends the rest back unchanged. Archiving is required before Delete Client. Not safe against a concurrent edit of the same client.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		clientId: clockifyAiProps.clientId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		address: Property.LongText({ displayName: 'Address', required: false }),
		note: Property.LongText({ displayName: 'Note', required: false }),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Archive (Yes) or unarchive (No) the client. Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		archiveProjects: Property.Checkbox({
			displayName: 'Archive Projects Too',
			description: 'When archiving, also archive the client projects. Default false.',
			required: false,
		}),
		markTasksAsDone: Property.Checkbox({
			displayName: 'Mark Tasks as Done',
			description: 'When archiving with its projects, also mark their tasks done. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const current = await clockifyApi.getClient({
			auth,
			workspaceId: propsValue.workspaceId,
			clientId: propsValue.clientId,
		});
		return await clockifyApi.updateClient({
			auth,
			workspaceId: propsValue.workspaceId,
			clientId: propsValue.clientId,
			client: {
				name: propsValue.name ?? current.name,
				email: propsValue.email ?? current.email,
				address: propsValue.address ?? current.address,
				note: propsValue.note ?? current.note,
				archived:
					clockifyUtils.toOptionalBoolean({ value: propsValue.archived }) ?? current.archived,
				currencyId: current.currencyId,
				ccEmails: current.ccEmails,
			},
			query: clockifyUtils.toQuery({
				params: {
					'archive-projects': propsValue.archiveProjects,
					'mark-tasks-as-done': propsValue.markTasksAsDone,
				},
			}),
		});
	},
});
