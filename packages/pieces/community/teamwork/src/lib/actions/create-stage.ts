import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createStage = createAction({
	name: 'create_stage',
	displayName: 'Create Stage',
	description: 'Create a stage for a project (Kanban column)',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
	},
	async run({ auth, propsValue }) {
		const body = { column: { name: propsValue.name } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/projects/${propsValue.projectId}/columns.json`, body });
	},
});


