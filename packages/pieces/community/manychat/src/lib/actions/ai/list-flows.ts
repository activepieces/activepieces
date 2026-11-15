import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../../auth';
import { manychatUtils } from '../../common/client';
import { manychatData } from '../../common/props';
import { manychatOutputSchemas } from '../../common/output-schemas';

export const listFlowsAiAction = createAction({
	auth: manychatAuth,
	name: 'list_flows',
	classification: 'SEARCH',
	displayName: 'List Flows',
	description: 'Lists every flow and flow folder in the ManyChat account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every flow in the ManyChat account with its namespace (ns), name and folder path, plus the folder tree. Use it to find the ns for "Send Flow to Subscriber". The list includes unpublished drafts, which cannot be sent. Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.listFlows,
	props: {},
	async run({ auth }) {
		const { flows, folders } = await manychatData.listFlows({ apiKey: manychatUtils.apiKeyOf(auth) });
		return {
			flows: flows.map((flow) => ({
				ns: flow['ns'],
				name: flow['name'],
				folder_id: flow['folder_id'],
				folder_name: manychatData.folderPath({ folderId: flow['folder_id'], folders }),
			})),
			folders: folders.map((folder) => ({ id: folder['id'], name: folder['name'], parent_id: folder['parent_id'] })),
			count: flows.length,
		};
	},
});
