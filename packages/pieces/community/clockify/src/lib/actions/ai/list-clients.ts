import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { clientsOutputSchema } from '../../output-schemas';

export const listClientsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_clients',
	outputSchema: clientsOutputSchema,
	displayName: 'List Clients',
	description: 'Lists or searches the clients of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the clients of a Clockify workspace, optionally filtered by name or archived state. Use it to find a client ID. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only clients whose name contains this text.',
			required: false,
		}),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Optional: only archived (Yes) or only active (No) clients. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const clients = await clockifyApi.listClients({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					archived: propsValue.archived,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { clients, count: clients.length };
	},
});
